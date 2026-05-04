import { create } from 'zustand';
import type { Feedback, Grade4, OpeningSuggestion, TopicSuggestion, Writing, WritingType } from '@/types/writing';
import { db, newId, saveWriting } from '@/services/db';

const MAX_REVISIONS = 5;

interface DraftState {
  type: WritingType | null;
  grade: Grade4 | undefined;
  /** 학생이 입력한 키워드 (글감 찾기) */
  keywords: string;
  /** 선택된 글감 */
  topic: string | undefined;
  /** AI가 제안한 글감 후보 */
  topicSuggestions: TopicSuggestion[];
  /** AI가 제안한 첫 문장 후보 */
  openingSuggestions: OpeningSuggestion[];
  /** 현재 작업 중인 글 id (IndexedDB) */
  currentWritingId: string | null;
}

interface UIState {
  loadingTopics: boolean;
  loadingOpenings: boolean;
  loadingFeedback: boolean;
  /** 마지막 에러 메시지 (UI에 노출) */
  lastError: string | null;
}

interface Actions {
  setType(type: WritingType): void;
  setGrade(grade: Grade4 | undefined): void;
  setKeywords(value: string): void;
  setTopic(topic: string | undefined): void;
  setTopicSuggestions(list: TopicSuggestion[]): void;
  setOpeningSuggestions(list: OpeningSuggestion[]): void;
  resetDraft(): void;

  setLoading(key: keyof UIState, value: boolean): void;
  setError(msg: string | null): void;

  /** 새 글 생성 후 id 반환 */
  createWriting(initialText?: string): Promise<string>;
  /** 현재 회차의 본문 업데이트 (자동 저장) */
  updateCurrentText(id: string, text: string): Promise<void>;
  /** 첨삭 결과를 현재 회차에 저장. 이전 회차와 동일 본문이면 회차 추가 X */
  applyFeedback(id: string, feedback: Feedback, currentText: string): Promise<void>;
  /** 새 회차 시작 (학생이 글 수정 후 다시 분석할 때 호출) */
  startNewRevision(id: string, newText: string): Promise<void>;
}

type WritingStore = DraftState & UIState & Actions;

const initialDraft: DraftState = {
  type: null,
  grade: undefined,
  keywords: '',
  topic: undefined,
  topicSuggestions: [],
  openingSuggestions: [],
  currentWritingId: null,
};

const initialUI: UIState = {
  loadingTopics: false,
  loadingOpenings: false,
  loadingFeedback: false,
  lastError: null,
};

export const useWritingStore = create<WritingStore>((set, get) => ({
  ...initialDraft,
  ...initialUI,

  setType: (type) => set({ type }),
  setGrade: (grade) => set({ grade }),
  setKeywords: (value) => set({ keywords: value }),
  setTopic: (topic) => set({ topic }),
  setTopicSuggestions: (list) => set({ topicSuggestions: list }),
  setOpeningSuggestions: (list) => set({ openingSuggestions: list }),
  resetDraft: () => set({ ...initialDraft }),

  setLoading: (key, value) => set({ [key]: value } as Partial<UIState>),
  setError: (msg) => set({ lastError: msg }),

  async createWriting(initialText = '') {
    const { type, grade, topic } = get();
    if (!type) throw new Error('글 종류가 선택되지 않았습니다.');
    const id = newId();
    const now = Date.now();
    const writing: Writing = {
      id,
      type,
      grade,
      topic,
      createdAt: now,
      updatedAt: now,
      revisions: [
        {
          index: 1,
          text: initialText,
          feedback: null,
          timestamp: now,
        },
      ],
    };
    await saveWriting(writing);
    set({ currentWritingId: id });
    return id;
  },

  async updateCurrentText(id, text) {
    const writing = await db.writings.get(id);
    if (!writing) return;
    const last = writing.revisions[writing.revisions.length - 1];
    if (!last) return;
    // 분석 전 회차이면 같은 회차에 덮어쓰기. 분석 완료된 회차이면 새 회차 만들지 않고 마지막 회차 텍스트만 업데이트
    if (last.feedback === null) {
      last.text = text;
      last.timestamp = Date.now();
    } else {
      // 학생이 수정 중이지만 새 회차는 startNewRevision 호출 시 생성
      last.text = text;
      last.timestamp = Date.now();
    }
    await saveWriting(writing);
  },

  async applyFeedback(id, feedback, currentText) {
    const writing = await db.writings.get(id);
    if (!writing) return;
    const last = writing.revisions[writing.revisions.length - 1];
    if (!last) return;
    last.text = currentText;
    last.feedback = feedback;
    last.timestamp = Date.now();
    await saveWriting(writing);
  },

  async startNewRevision(id, newText) {
    const writing = await db.writings.get(id);
    if (!writing) return;
    const last = writing.revisions[writing.revisions.length - 1];
    // 이전 회차와 동일 본문이면 새 회차 X
    if (last && last.text.trim() === newText.trim()) return;
    if (writing.revisions.length >= MAX_REVISIONS) {
      // 최대 5회. 더 못 추가 — 마지막 회차에 덮어쓰기
      if (last) {
        last.text = newText;
        last.feedback = null;
        last.timestamp = Date.now();
      }
    } else {
      writing.revisions.push({
        index: writing.revisions.length + 1,
        text: newText,
        feedback: null,
        timestamp: Date.now(),
      });
    }
    await saveWriting(writing);
  },
}));
