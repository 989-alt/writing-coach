import type { WritingType } from '@/types/writing';

export interface UnitInfo {
  grade: 5 | 6;
  semester: 1 | 2;
  /** 단원 번호 + 제목 (22개정 국어과 5~6학년 기준 추정) */
  unitTitle: string;
  /** 핵심 성취 기준 키워드 (학생용 평이 표현) */
  achievement: string;
}

/**
 * 글 종류별 22개정 5~6학년 단원 매핑.
 * 출처: 22개정 교육과정 + 아이스크림미디어 표준 단원 (1차 큐레이션, 추후 보강).
 * 정확한 차시·페이지는 교과서 검토 후 수정 가능하도록 데이터 모듈로 분리.
 */
export const UNITS_BY_TYPE: Record<WritingType, UnitInfo[]> = {
  설명문: [
    {
      grade: 5,
      semester: 1,
      unitTitle: '5학년 1학기 · 설명하는 글의 짜임',
      achievement: '대상의 특징을 차례에 맞게 설명할 수 있다',
    },
    {
      grade: 6,
      semester: 2,
      unitTitle: '6학년 2학기 · 정보를 전달하는 글',
      achievement: '읽는 이를 고려해 정보를 정확히 전달한다',
    },
  ],
  논설문: [
    {
      grade: 5,
      semester: 2,
      unitTitle: '5학년 2학기 · 주장과 근거를 판단하며',
      achievement: '주장에 알맞은 근거를 들어 글을 쓴다',
    },
    {
      grade: 6,
      semester: 1,
      unitTitle: '6학년 1학기 · 논설문 쓰기',
      achievement: '문제 상황에 대한 자신의 의견을 논리적으로 쓴다',
    },
  ],
  뉴스기사: [
    {
      grade: 6,
      semester: 1,
      unitTitle: '6학년 1학기 · 뉴스와 광고를 알아보아요',
      achievement: '사실과 의견을 구분해 뉴스를 만든다',
    },
  ],
  이야기: [
    {
      grade: 5,
      semester: 1,
      unitTitle: '5학년 1학기 · 이야기를 간추려요',
      achievement: '인물·사건·배경을 살려 이야기를 쓴다',
    },
    {
      grade: 6,
      semester: 2,
      unitTitle: '6학년 2학기 · 작품 속 인물과 나',
      achievement: '인물의 삶을 자기 삶과 연관 지어 이야기를 쓴다',
    },
  ],
  시: [
    {
      grade: 5,
      semester: 2,
      unitTitle: '5학년 2학기 · 마음을 나누는 시',
      achievement: '비유와 운율을 살려 시를 쓴다',
    },
    {
      grade: 6,
      semester: 1,
      unitTitle: '6학년 1학기 · 시를 즐겨 보아요',
      achievement: '시의 표현 방법을 살려 자신의 시를 쓴다',
    },
  ],
  일기: [
    {
      grade: 5,
      semester: 1,
      unitTitle: '5학년 1학기 · 마음을 표현하는 글',
      achievement: '겪은 일과 그때의 마음을 솔직하게 쓴다',
    },
  ],
  독후감: [
    {
      grade: 5,
      semester: 2,
      unitTitle: '5학년 2학기 · 책을 읽고 생각을 나누어요',
      achievement: '책을 읽고 자신의 생각과 느낌을 글로 쓴다',
    },
    {
      grade: 6,
      semester: 2,
      unitTitle: '6학년 2학기 · 책을 읽고 의견 나누기',
      achievement: '책의 내용을 자기 경험과 연결해 글을 쓴다',
    },
  ],
  편지글: [
    {
      grade: 5,
      semester: 1,
      unitTitle: '5학년 1학기 · 마음을 전하는 글',
      achievement: '받는 이를 고려해 편지를 쓴다',
    },
  ],
  광고문: [
    {
      grade: 6,
      semester: 1,
      unitTitle: '6학년 1학기 · 광고를 만들어 보아요',
      achievement: '간결하고 인상적인 표현으로 광고문을 쓴다',
    },
  ],
  안내문: [
    {
      grade: 5,
      semester: 2,
      unitTitle: '5학년 2학기 · 알리는 글',
      achievement: '읽는 이가 정보를 빠뜨리지 않도록 안내문을 쓴다',
    },
  ],
};
