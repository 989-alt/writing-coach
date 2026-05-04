// 글 종류 10가지 (PRD 4장 F1)
export const WRITING_TYPES = [
  '설명문',
  '논설문',
  '뉴스기사',
  '이야기',
  '시',
  '일기',
  '독후감',
  '편지글',
  '광고문',
  '안내문',
] as const;

export type WritingType = (typeof WRITING_TYPES)[number];

// 4단계 등급 — 숫자 점수 절대 X (PRD HC3)
export type Grade = '잘함' | '괜찮음' | '노력' | '다시';

// 4영역 평가 키
export type FeedbackArea = 'spelling' | 'structure' | 'context' | 'expression';

export const FEEDBACK_AREA_LABEL: Record<FeedbackArea, string> = {
  spelling: '맞춤법·문장',
  structure: '구조',
  context: '맥락·논리',
  expression: '표현·어휘',
};

export const FEEDBACK_AREA_COLOR: Record<FeedbackArea, string> = {
  spelling: 'var(--color-spelling)',
  structure: 'var(--color-structure)',
  context: 'var(--color-context)',
  expression: 'var(--color-expression)',
};

export const GRADE_COLOR: Record<Grade, string> = {
  잘함: 'var(--color-grade-best)',
  괜찮음: 'var(--color-grade-ok)',
  노력: 'var(--color-grade-effort)',
  다시: 'var(--color-grade-again)',
};

export type Grade4 = 3 | 4 | 5 | 6;

export interface InlineMark {
  area: FeedbackArea;
  /** 학생 글에서 정확히 일치하는 발췌 (위치 계산은 client에서) */
  snippet: string;
  /** 어떻게 고치면 좋을지 — 자동 수정 X */
  comment: string;
}

export interface Feedback {
  praise: string;
  scores: Record<FeedbackArea, Grade>;
  inlineMarks: InlineMark[];
  encouragement: string;
  generatedAt: number;
}

export interface Revision {
  index: number;
  text: string;
  feedback: Feedback | null;
  selfCheckResults?: boolean[];
  timestamp: number;
}

export interface Writing {
  id: string;
  type: WritingType;
  grade?: Grade4;
  topic?: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  revisions: Revision[];
}

// 글감/첫마디 응답 타입 (AI 응답)
export interface TopicSuggestion {
  title: string;
  description: string;
}

export interface OpeningSuggestion {
  approach: '정공법' | '질문형' | '장면 묘사';
  sentence: string;
  tone: string;
}
