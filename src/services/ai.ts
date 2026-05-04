// 클라이언트 사이드 Gemini 호출.
// 키는 빌드 번들에 인라인하지 않고 사용자 브라우저 localStorage에서만 보관한다.
// (이전엔 VITE_GEMINI_API_KEY를 인라인했지만 Google이 public bundle에서 감지해
//  자동 leak 처리하므로 키 입력 UI 방식으로 전환)
import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai';
import type { Feedback, OpeningSuggestion, TopicSuggestion, WritingType } from '@/types/writing';

const STORAGE_KEY = 'writing-coach.gemini-api-key';

/** 개발 환경 fallback. dev 서버에서만 .env.local의 키 사용. 프로덕션 빌드에는 미포함. */
const DEV_FALLBACK_KEY = import.meta.env.DEV
  ? ((import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() || '')
  : '';

export function getApiKey(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)?.trim();
    if (stored) return stored;
  }
  return DEV_FALLBACK_KEY;
}

export function setApiKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  cached = null; // 키 변경 시 클라이언트 재생성
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

/**
 * "API 키 미설정" 에러를 식별하는 sentinel. 컴포넌트가 이 메시지로 분기하여 입력 모달 노출.
 */
export const API_KEY_MISSING_ERROR = 'API_KEY_MISSING';

let cached: GoogleGenerativeAI | null = null;
let cachedKey: string | null = null;

function getClient(): GoogleGenerativeAI {
  const key = getApiKey();
  if (!key) {
    throw new Error(API_KEY_MISSING_ERROR);
  }
  if (!cached || cachedKey !== key) {
    cached = new GoogleGenerativeAI(key);
    cachedKey = key;
  }
  return cached;
}

async function callJson<T>(opts: {
  systemInstruction: string;
  userPrompt: string;
  responseSchema: unknown;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<T> {
  const generationConfig: GenerationConfig = {
    temperature: opts.temperature ?? 0.7,
    maxOutputTokens: opts.maxOutputTokens ?? 4096,
    responseMimeType: 'application/json',
    // @ts-expect-error responseSchema 타입은 SDK에서 약함
    responseSchema: opts.responseSchema,
    thinkingConfig: { thinkingBudget: 0 },
  };
  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: opts.systemInstruction,
    generationConfig,
  });
  const result = await model.generateContent(opts.userPrompt);
  const candidate = result.response.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const text = result.response.text();
  if (finishReason && finishReason !== 'STOP') {
    if (finishReason === 'MAX_TOKENS') {
      throw new Error('AI 응답이 너무 길어 잘렸어요. 잠시 후 다시 시도해 주세요.');
    }
    throw new Error(`AI 응답이 정상 종료되지 않았어요 (${finishReason}).`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error(`Gemini 응답을 JSON으로 파싱하지 못했습니다: ${text.slice(0, 200)}`);
  }
}

// =============== 프롬프트 ===============

const HARD_CONSTRAINTS = `
[절대 금지 — 모든 응답에 적용]
- 학생을 비난하거나 부정적 톤("틀렸다", "엉망이다", "기본도 안 됐다") 사용 금지
- 100점 만점 점수, 등수, 타인과의 비교 금지
- 학생 글의 본문이나 결론을 대신 작성하지 말 것
- 첫 문장 후보를 학생 글 칸에 자동 입력한다는 가정 금지
- 폭력·차별·성적 내용 금지
- 어려운 문법 용어보다 학년 수준 표현 사용("주술 호응" → "주어와 서술어가 잘 어울려요")
- 항상 잘한 점을 먼저, 격려로 마무리
`.trim();

const TOPIC_SYSTEM_PROMPT = `당신은 한국 초등학교 5~6학년 학생을 돕는 글쓰기 코치입니다.
역할은 글감(소재) 제안만 하는 것입니다. 본문이나 예시 글은 절대 쓰지 않습니다.
${HARD_CONSTRAINTS}`;

const OPENING_SYSTEM_PROMPT = `당신은 한국 초등학교 5~6학년 학생을 돕는 글쓰기 코치입니다.
역할은 첫 문장 1개씩의 후보를 3개 제시하는 것입니다. 첫 단락이나 본문은 절대 쓰지 않습니다.
학생이 그대로 베끼지 않도록, 짧고 영감 위주로 작성합니다.
${HARD_CONSTRAINTS}`;

const FEEDBACK_SYSTEM_PROMPT = `당신은 한국 초등학교 5~6학년 국어 교사이자 따뜻한 글쓰기 코치입니다.
학생 글을 4영역(맞춤법·문장 / 구조 / 맥락·논리 / 표현·어휘)으로 살펴보고
잘한 점을 먼저 짚어 주고, 영역별 등급(잘함·괜찮음·노력·다시) 4단어 중 하나를 부여합니다.
inlineMarks의 snippet은 학생 글 본문에서 정확히 등장하는 부분을 그대로 옮깁니다.
comment는 자동 수정문이 아닌 "이렇게 고쳐 보면 어떨까요?" 형태의 제안입니다.
${HARD_CONSTRAINTS}`;

const TYPE_GUIDE: Record<string, { structure: string; rubric: string; tone: string }> = {
  설명문: { structure: '처음(소개) → 중간(특징·예시) → 끝(정리)', rubric: '대상의 특징을 차례에 맞게 객관적으로 설명했는가, 정확한 정보를 전달했는가', tone: '객관적·차분한 어조' },
  논설문: { structure: '서론(문제 제기) → 본론(주장+근거 2개 이상) → 결론', rubric: '주장이 분명한가, 근거가 타당하고 구체적인가, 결론이 본론과 이어지는가', tone: '분명하지만 단정적이지 않은 어조' },
  뉴스기사: { structure: '표제 → 전문(요약) → 본문(육하원칙)', rubric: '누가·언제·어디서·무엇을·어떻게·왜가 드러나는가, 사실과 의견이 구분되는가', tone: '객관적·중립적 어조' },
  이야기: { structure: '발단 → 전개 → 절정 → 결말', rubric: '인물·사건·배경이 살아있는가, 갈등과 해결이 자연스러운가, 묘사가 구체적인가', tone: '생생한 묘사 어조' },
  시: { structure: '행과 연으로 나누기, 비유·반복·운율 살리기', rubric: '비유·심상·운율이 잘 드러나는가, 함축적 표현인가', tone: '함축적·감성적 어조' },
  일기: { structure: '있었던 일 → 그때 마음 → 생각·다짐', rubric: '솔직한 마음이 드러나는가, 시간·장면이 구체적인가', tone: '편안하고 솔직한 어조' },
  독후감: { structure: '책 소개 → 인상 깊은 장면 → 내 생각·느낌', rubric: '책 내용을 잘 요약했는가, 자기 경험과 연결했는가, 구체적 근거가 있는가', tone: '차분하고 진심 어린 어조' },
  편지글: { structure: '받는 사람 → 첫인사 → 전할 말 → 끝인사 → 보낸 사람', rubric: '편지 형식이 갖춰졌는가, 받는 사람을 고려한 어조인가, 진심이 담겼는가', tone: '받는 사람을 배려한 어조' },
  광고문: { structure: '관심 끌기 → 핵심 정보 → 행동 유도', rubric: '간결하고 인상적인가, 핵심 메시지가 분명한가', tone: '간결·매력적 어조' },
  안내문: { structure: '제목 → 무엇을·언제·어디서 → 자세한 안내 → 문의', rubric: '필수 정보가 누락 없이 들어 있는가, 항목이 명확히 구분되는가', tone: '명확하고 친절한 어조' },
};

// =============== 스키마 ===============

const TOPICS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    topics: {
      type: 'ARRAY',
      minItems: 6,
      maxItems: 8,
      items: {
        type: 'OBJECT',
        properties: { title: { type: 'STRING' }, description: { type: 'STRING' } },
        required: ['title', 'description'],
      },
    },
  },
  required: ['topics'],
};

const OPENINGS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    openings: {
      type: 'ARRAY',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'OBJECT',
        properties: {
          approach: { type: 'STRING' },
          sentence: { type: 'STRING' },
          tone: { type: 'STRING' },
        },
        required: ['approach', 'sentence', 'tone'],
      },
    },
  },
  required: ['openings'],
};

const GRADE_ENUM = ['잘함', '괜찮음', '노력', '다시'];
const AREA_ENUM = ['spelling', 'structure', 'context', 'expression'];

const FEEDBACK_SCHEMA = {
  type: 'OBJECT',
  properties: {
    praise: { type: 'STRING' },
    scores: {
      type: 'OBJECT',
      properties: {
        spelling: { type: 'STRING', enum: GRADE_ENUM },
        structure: { type: 'STRING', enum: GRADE_ENUM },
        context: { type: 'STRING', enum: GRADE_ENUM },
        expression: { type: 'STRING', enum: GRADE_ENUM },
      },
      required: ['spelling', 'structure', 'context', 'expression'],
    },
    inlineMarks: {
      type: 'ARRAY',
      minItems: 0,
      maxItems: 8,
      items: {
        type: 'OBJECT',
        properties: {
          area: { type: 'STRING', enum: AREA_ENUM },
          snippet: { type: 'STRING' },
          comment: { type: 'STRING' },
        },
        required: ['area', 'snippet', 'comment'],
      },
    },
    encouragement: { type: 'STRING' },
  },
  required: ['praise', 'scores', 'inlineMarks', 'encouragement'],
};

// =============== 공개 API ===============

export async function fetchTopics(input: {
  writingType: WritingType;
  grade?: number;
  keywords: string;
}): Promise<TopicSuggestion[]> {
  const guide = TYPE_GUIDE[input.writingType];
  const userPrompt = `학생 정보:
- 글 종류: ${input.writingType}
- 학년: ${input.grade ?? '미지정'}학년
- 학생이 입력한 키워드/관심사: ${input.keywords}
- 이 글 종류의 특성: ${guide?.tone ?? ''}

다음 형식의 JSON으로 6~8개의 글감 후보를 제시하세요:
{ "topics": [{ "title": "...", "description": "..." }, ...] }

규칙:
- 학년 수준에 맞는 어휘와 소재
- 글 종류에 어울리는 글감
- 부적절(폭력·차별·성적 등) 주제 자동 제외
- 본문/단락/예시 글 절대 포함 금지 (제목 + 짧은 설명만)`;
  const result = await callJson<{ topics: TopicSuggestion[] }>({
    systemInstruction: TOPIC_SYSTEM_PROMPT,
    userPrompt,
    responseSchema: TOPICS_SCHEMA,
    temperature: 0.85,
    maxOutputTokens: 1024,
  });
  if (!Array.isArray(result.topics) || result.topics.length === 0) {
    throw new Error('AI 응답에 글감이 비어 있어요.');
  }
  return result.topics.slice(0, 8);
}

export async function fetchOpenings(input: {
  writingType: WritingType;
  grade?: number;
  topic: string;
}): Promise<OpeningSuggestion[]> {
  const guide = TYPE_GUIDE[input.writingType];
  const userPrompt = `학생 정보:
- 글 종류: ${input.writingType}
- 학년: ${input.grade ?? '미지정'}학년
- 글감/주제: ${input.topic}
- 이 글 종류의 어조: ${guide?.tone ?? ''}

서로 다른 접근법의 첫 문장 후보 3개를 다음 형식의 JSON으로 제시하세요:
{ "openings": [
  { "approach": "정공법", "sentence": "...", "tone": "..." },
  { "approach": "질문형", "sentence": "...", "tone": "..." },
  { "approach": "장면 묘사", "sentence": "...", "tone": "..." }
] }

규칙:
- 첫 문장 1개씩만 (단락·본문·결론 작성 금지)
- 학년·종류에 맞는 어휘
- 학생이 그대로 베끼지 않도록 영감 위주, 너무 길지 않게
- 시: 함축적, 뉴스기사: 객관적, 이야기: 묘사 중심, 논설문: 분명하지만 부드럽게`;
  const result = await callJson<{ openings: OpeningSuggestion[] }>({
    systemInstruction: OPENING_SYSTEM_PROMPT,
    userPrompt,
    responseSchema: OPENINGS_SCHEMA,
    temperature: 0.9,
    maxOutputTokens: 768,
  });
  if (!Array.isArray(result.openings) || result.openings.length < 1) {
    throw new Error('AI 응답에 첫 문장 후보가 비어 있어요.');
  }
  return result.openings.slice(0, 3);
}

export async function fetchFeedback(input: {
  writingType: WritingType;
  grade?: number;
  text: string;
}): Promise<Feedback> {
  if (!input.text || input.text.trim().length < 10) {
    throw new Error('학생 글이 너무 짧아요. 30자 이상 작성한 뒤 분석해 주세요.');
  }
  const guide = TYPE_GUIDE[input.writingType] ?? { structure: '', rubric: '', tone: '' };
  const userPrompt = `학생 정보:
- 학년: ${input.grade ?? '미지정'}학년
- 글 종류: ${input.writingType}
- 이 글 종류의 짜임: ${guide.structure}
- 이 글 종류의 평가 핵심: ${guide.rubric}
- 어조: ${guide.tone}

학생 글 본문:
"""
${input.text}
"""

다음 형식의 JSON으로 첨삭 결과를 작성하세요:
{
  "praise": "...",
  "scores": { "spelling": "...", "structure": "...", "context": "...", "expression": "..." },
  "inlineMarks": [{ "area": "spelling|structure|context|expression", "snippet": "...", "comment": "..." }],
  "encouragement": "..."
}

규칙:
- 100점 만점 점수, 등수, 타인 비교 절대 금지
- 부정적 표현 절대 금지
- 잘한 점을 먼저, 격려로 마무리
- snippet은 반드시 학생 글 본문에 정확히 등장하는 문자열
- 글의 본문을 다시 써 주거나 자동 수정문을 만들지 말 것
- 학년 수준의 어휘 사용`;
  const raw = await callJson<{
    praise: string;
    scores: Feedback['scores'];
    inlineMarks: Feedback['inlineMarks'];
    encouragement: string;
  }>({
    systemInstruction: FEEDBACK_SYSTEM_PROMPT,
    userPrompt,
    responseSchema: FEEDBACK_SCHEMA,
    temperature: 0.5,
    maxOutputTokens: 2048,
  });
  // snippet이 본문에 실제 등장하는지 검증
  const filteredMarks = (raw.inlineMarks ?? []).filter(
    (m) => m.snippet && input.text.includes(m.snippet),
  );
  return {
    praise: raw.praise ?? '',
    scores: raw.scores,
    inlineMarks: filteredMarks,
    encouragement: raw.encouragement ?? '',
    generatedAt: Date.now(),
  };
}
