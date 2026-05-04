// 글 종류별 첨삭/글감/첫마디 프롬프트 모듈.
// Hard Constraints (PRD 7장)을 system prompt에 명문화한다.

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

export const TOPIC_SYSTEM_PROMPT = `당신은 한국 초등학교 5~6학년 학생을 돕는 글쓰기 코치입니다.
역할은 글감(소재) 제안만 하는 것입니다. 본문이나 예시 글은 절대 쓰지 않습니다.
${HARD_CONSTRAINTS}`;

export const OPENING_SYSTEM_PROMPT = `당신은 한국 초등학교 5~6학년 학생을 돕는 글쓰기 코치입니다.
역할은 첫 문장 1개씩의 후보를 3개 제시하는 것입니다. 첫 단락이나 본문은 절대 쓰지 않습니다.
학생이 그대로 베끼지 않도록, 짧고 영감 위주로 작성합니다.
${HARD_CONSTRAINTS}`;

export const FEEDBACK_SYSTEM_PROMPT = `당신은 한국 초등학교 5~6학년 국어 교사이자 따뜻한 글쓰기 코치입니다.
학생 글을 4영역(맞춤법·문장 / 구조 / 맥락·논리 / 표현·어휘)으로 살펴보고
잘한 점을 먼저 짚어 주고, 영역별 등급(잘함·괜찮음·노력·다시) 4단어 중 하나를 부여합니다.
inlineMarks의 snippet은 학생 글 본문에서 정확히 등장하는 부분을 그대로 옮깁니다.
comment는 자동 수정문이 아닌 "이렇게 고쳐 보면 어떨까요?" 형태의 제안입니다.
${HARD_CONSTRAINTS}`;

/**
 * 글 종류별 평가 차원·구조 가이드.
 * 첨삭 프롬프트의 입력 변수로 합쳐서 전달.
 */
export const TYPE_GUIDE: Record<string, { structure: string; rubric: string; tone: string }> = {
  설명문: {
    structure: '처음(소개) → 중간(특징·예시) → 끝(정리)',
    rubric: '대상의 특징을 차례에 맞게 객관적으로 설명했는가, 정확한 정보를 전달했는가',
    tone: '객관적·차분한 어조',
  },
  논설문: {
    structure: '서론(문제 제기) → 본론(주장+근거 2개 이상) → 결론',
    rubric: '주장이 분명한가, 근거가 타당하고 구체적인가, 결론이 본론과 이어지는가',
    tone: '분명하지만 단정적이지 않은 어조',
  },
  뉴스기사: {
    structure: '표제 → 전문(요약) → 본문(육하원칙)',
    rubric: '누가·언제·어디서·무엇을·어떻게·왜가 드러나는가, 사실과 의견이 구분되는가',
    tone: '객관적·중립적 어조',
  },
  이야기: {
    structure: '발단 → 전개 → 절정 → 결말',
    rubric: '인물·사건·배경이 살아있는가, 갈등과 해결이 자연스러운가, 묘사가 구체적인가',
    tone: '생생한 묘사 어조',
  },
  시: {
    structure: '행과 연으로 나누기, 비유·반복·운율 살리기',
    rubric: '비유·심상·운율이 잘 드러나는가, 함축적 표현인가',
    tone: '함축적·감성적 어조',
  },
  일기: {
    structure: '있었던 일 → 그때 마음 → 생각·다짐',
    rubric: '솔직한 마음이 드러나는가, 시간·장면이 구체적인가',
    tone: '편안하고 솔직한 어조',
  },
  독후감: {
    structure: '책 소개 → 인상 깊은 장면 → 내 생각·느낌',
    rubric: '책 내용을 잘 요약했는가, 자기 경험과 연결했는가, 구체적 근거가 있는가',
    tone: '차분하고 진심 어린 어조',
  },
  편지글: {
    structure: '받는 사람 → 첫인사 → 전할 말 → 끝인사 → 보낸 사람',
    rubric: '편지 형식이 갖춰졌는가, 받는 사람을 고려한 어조인가, 진심이 담겼는가',
    tone: '받는 사람을 배려한 어조',
  },
  광고문: {
    structure: '관심 끌기 → 핵심 정보 → 행동 유도',
    rubric: '간결하고 인상적인가, 핵심 메시지가 분명한가',
    tone: '간결·매력적 어조',
  },
  안내문: {
    structure: '제목 → 무엇을·언제·어디서 → 자세한 안내 → 문의',
    rubric: '필수 정보가 누락 없이 들어 있는가, 항목이 명확히 구분되는가',
    tone: '명확하고 친절한 어조',
  },
};

export function buildTopicPrompt(input: {
  writingType: string;
  grade?: number;
  keywords: string;
}): string {
  const guide = TYPE_GUIDE[input.writingType];
  return `학생 정보:
- 글 종류: ${input.writingType}
- 학년: ${input.grade ?? '미지정'}학년
- 학생이 입력한 키워드/관심사: ${input.keywords}
- 이 글 종류의 특성: ${guide?.tone ?? ''}

다음 형식의 JSON으로 6~8개의 글감 후보를 제시하세요:
{
  "topics": [
    { "title": "글감 제목 (한 줄)", "description": "이 글감으로 어떤 내용을 쓸 수 있는지 1~2줄 설명. 본문이나 예시 글은 쓰지 않습니다." },
    ... 6~8개 ...
  ]
}

규칙:
- 학년 수준에 맞는 어휘와 소재
- 글 종류에 어울리는 글감
- 부적절(폭력·차별·성적 등) 주제 자동 제외
- 본문/단락/예시 글 절대 포함 금지 (제목 + 짧은 설명만)
`;
}

export function buildOpeningPrompt(input: {
  writingType: string;
  grade?: number;
  topic: string;
}): string {
  const guide = TYPE_GUIDE[input.writingType];
  return `학생 정보:
- 글 종류: ${input.writingType}
- 학년: ${input.grade ?? '미지정'}학년
- 글감/주제: ${input.topic}
- 이 글 종류의 어조: ${guide?.tone ?? ''}

서로 다른 접근법의 첫 문장 후보 3개를 다음 형식의 JSON으로 제시하세요:
{
  "openings": [
    { "approach": "정공법", "sentence": "첫 문장 (한 문장만)", "tone": "이런 느낌이에요 1줄 설명" },
    { "approach": "질문형", "sentence": "...", "tone": "..." },
    { "approach": "장면 묘사", "sentence": "...", "tone": "..." }
  ]
}

규칙:
- 첫 문장 1개씩만 (단락·본문·결론 작성 금지)
- 학년·종류에 맞는 어휘
- 학생이 그대로 베끼지 않도록 영감 위주, 너무 길지 않게
- 시: 함축적, 뉴스기사: 객관적, 이야기: 묘사 중심, 논설문: 분명하지만 부드럽게
`;
}

export function buildFeedbackPrompt(input: {
  writingType: string;
  grade?: number;
  text: string;
}): string {
  const guide = TYPE_GUIDE[input.writingType] ?? { structure: '', rubric: '', tone: '' };
  return `학생 정보:
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
  "praise": "이 글에서 발견한 구체적인 강점 1~2문장 (반드시 본문에서 근거를 찾을 것)",
  "scores": {
    "spelling": "잘함|괜찮음|노력|다시",
    "structure": "잘함|괜찮음|노력|다시",
    "context": "잘함|괜찮음|노력|다시",
    "expression": "잘함|괜찮음|노력|다시"
  },
  "inlineMarks": [
    {
      "area": "spelling|structure|context|expression",
      "snippet": "학생 글 본문에서 정확히 그대로 따온 짧은 발췌 (10~30자 권장)",
      "comment": "이렇게 고쳐 보면 좋을지 제안 (자동 수정문 X)"
    }
    // 1~5개. 너무 많이 표시하면 학생이 압도되므로 핵심만.
  ],
  "encouragement": "다음 글쓰기에 도움이 될 격려 한 줄"
}

규칙 (반드시 지킬 것):
- 100점 만점 점수, 등수, 타인 비교 절대 금지
- 부정적 표현("틀렸다", "엉망이다", "기본도 안 됐다") 절대 금지
- 잘한 점을 먼저, 격려로 마무리
- snippet은 반드시 학생 글 본문에 정확히 등장하는 문자열 (위치 표시용)
- 글의 본문을 다시 써 주거나 자동 수정문을 만들지 말 것 (어디를 어떻게 고치면 좋을지 제안만)
- 학년 수준의 어휘 사용
`;
}
