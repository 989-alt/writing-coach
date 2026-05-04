import type { WritingType, FeedbackArea } from '@/types/writing';

export interface WritingTypeMeta {
  type: WritingType;
  emoji: string;
  short: string;
  /** 학생용 짧은 설명 */
  description: string;
  /** 권장 글자 수 (한글 기준) */
  recommendedLength: { min: number; max: number };
  /** 글 구조 가이드 (학생용 1줄) */
  structureGuide: string;
  /** 4영역 중 특히 강조할 영역 (UI에서 강조 표시) */
  emphasizedAreas: FeedbackArea[];
  /** 글 종류별 평가 시 함께 볼 추가 차원 (프롬프트용) */
  rubricFocus: string;
}

export const WRITING_TYPE_META: Record<WritingType, WritingTypeMeta> = {
  설명문: {
    type: '설명문',
    emoji: '📖',
    short: '대상이나 사실을 차근차근',
    description: '어떤 대상·현상·사실을 객관적으로 설명하는 글이에요.',
    recommendedLength: { min: 300, max: 600 },
    structureGuide: '처음(소개) → 중간(특징·예시) → 끝(정리)',
    emphasizedAreas: ['structure', 'context', 'expression'],
    rubricFocus: '객관적 어휘, 정확한 정보 전달, 처음-중간-끝 구조',
  },
  논설문: {
    type: '논설문',
    emoji: '🗣️',
    short: '주장과 근거로 설득',
    description: '하고 싶은 주장을 근거를 들어 설득하는 글이에요.',
    recommendedLength: { min: 400, max: 800 },
    structureGuide: '서론(문제 제기) → 본론(주장+근거 2개 이상) → 결론',
    emphasizedAreas: ['structure', 'context'],
    rubricFocus: '주장의 명확성, 근거의 타당성, 서론-본론-결론 구조',
  },
  뉴스기사: {
    type: '뉴스기사',
    emoji: '📰',
    short: '사실을 객관적으로',
    description: '실제 일어난 일을 사실대로 전하는 글이에요.',
    recommendedLength: { min: 200, max: 500 },
    structureGuide: '표제 → 전문(요약) → 본문(육하원칙)',
    emphasizedAreas: ['context', 'expression'],
    rubricFocus: '육하원칙(누가·언제·어디서·무엇을·어떻게·왜), 객관성',
  },
  이야기: {
    type: '이야기',
    emoji: '🌳',
    short: '인물·사건·배경으로 풀어가는',
    description: '인물이 사건을 겪는 흐름을 이야기로 풀어내는 글이에요.',
    recommendedLength: { min: 300, max: 800 },
    structureGuide: '발단 → 전개 → 절정 → 결말',
    emphasizedAreas: ['structure', 'expression'],
    rubricFocus: '인물·사건·배경, 갈등과 해결, 묘사',
  },
  시: {
    type: '시',
    emoji: '🌿',
    short: '함축과 운율로',
    description: '느낌과 마음을 짧고 함축적으로 담는 글이에요.',
    recommendedLength: { min: 50, max: 200 },
    structureGuide: '행과 연으로 나누기, 비유·반복·운율 살리기',
    emphasizedAreas: ['expression'],
    rubricFocus: '비유·심상·운율, 함축적 표현, 행/연 구분',
  },
  일기: {
    type: '일기',
    emoji: '🌙',
    short: '하루의 마음을 담아',
    description: '오늘 있었던 일과 그때 느낀 마음을 적는 글이에요.',
    recommendedLength: { min: 200, max: 500 },
    structureGuide: '있었던 일 → 그때 마음 → 생각·다짐',
    emphasizedAreas: ['expression', 'context'],
    rubricFocus: '솔직한 마음 표현, 시간 순서, 구체적 장면',
  },
  독후감: {
    type: '독후감',
    emoji: '📚',
    short: '책을 읽고 든 생각을',
    description: '책의 내용과 그때 든 내 생각·느낌을 정리하는 글이에요.',
    recommendedLength: { min: 300, max: 700 },
    structureGuide: '책 소개 → 인상 깊은 장면 → 내 생각·느낌',
    emphasizedAreas: ['context', 'expression'],
    rubricFocus: '책 내용 요약, 자기 경험 연결, 구체적 근거',
  },
  편지글: {
    type: '편지글',
    emoji: '✉️',
    short: '받는 사람을 떠올리며',
    description: '특정한 사람에게 마음을 전하는 글이에요.',
    recommendedLength: { min: 200, max: 500 },
    structureGuide: '받는 사람 → 첫인사 → 전할 말 → 끝인사 → 보낸 사람',
    emphasizedAreas: ['structure', 'expression'],
    rubricFocus: '편지 형식, 받는 사람을 고려한 어조, 진심 표현',
  },
  광고문: {
    type: '광고문',
    emoji: '📣',
    short: '짧고 인상 깊게',
    description: '알리고 싶은 점을 짧고 매력적으로 전하는 글이에요.',
    recommendedLength: { min: 80, max: 250 },
    structureGuide: '관심 끌기 → 핵심 정보 → 행동 유도',
    emphasizedAreas: ['expression', 'structure'],
    rubricFocus: '간결성, 인상적인 표현, 핵심 메시지',
  },
  안내문: {
    type: '안내문',
    emoji: '📌',
    short: '꼭 알아야 할 정보를',
    description: '행사·이용법 등을 정확히 알려 주는 글이에요.',
    recommendedLength: { min: 150, max: 400 },
    structureGuide: '제목 → 무엇을·언제·어디서 → 자세한 안내 → 문의',
    emphasizedAreas: ['structure', 'spelling'],
    rubricFocus: '필수 정보 누락 없음, 명확한 항목 구분',
  },
};

export const WRITING_TYPE_LIST = Object.values(WRITING_TYPE_META);
