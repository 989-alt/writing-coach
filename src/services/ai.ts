// 클라이언트는 Vercel Functions(/api/*)로 fetch만 한다.
// API 키(GEMINI_API_KEY)는 Vercel 환경변수(서버 사이드)에만 보관되며 클라이언트 번들에 일절 노출되지 않는다.
import type { Feedback, OpeningSuggestion, TopicSuggestion, WritingType } from '@/types/writing';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `서버 오류 (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson && typeof errJson.error === 'string') {
        message = errJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function fetchTopics(input: {
  writingType: WritingType;
  grade?: number;
  keywords: string;
}): Promise<TopicSuggestion[]> {
  const data = await postJson<{ topics: TopicSuggestion[] }>('/api/topics', input);
  if (!Array.isArray(data?.topics) || data.topics.length === 0) {
    throw new Error('AI 응답에 글감이 비어 있어요.');
  }
  return data.topics;
}

export async function fetchOpenings(input: {
  writingType: WritingType;
  grade?: number;
  topic: string;
}): Promise<OpeningSuggestion[]> {
  const data = await postJson<{ openings: OpeningSuggestion[] }>('/api/openings', input);
  if (!Array.isArray(data?.openings) || data.openings.length === 0) {
    throw new Error('AI 응답에 첫 문장 후보가 비어 있어요.');
  }
  return data.openings;
}

export async function fetchFeedback(input: {
  writingType: WritingType;
  grade?: number;
  text: string;
}): Promise<Feedback> {
  if (!input.text || input.text.trim().length < 10) {
    throw new Error('학생 글이 너무 짧아요. 30자 이상 작성한 뒤 분석해 주세요.');
  }
  const raw = await postJson<{
    praise: string;
    scores: Feedback['scores'];
    inlineMarks: Feedback['inlineMarks'];
    encouragement: string;
    generatedAt?: number;
  }>('/api/feedback', input);
  if (!raw.scores || typeof raw.praise !== 'string') {
    throw new Error('AI 응답 형식이 올바르지 않아요.');
  }
  return {
    praise: raw.praise,
    scores: raw.scores,
    inlineMarks: raw.inlineMarks ?? [],
    encouragement: raw.encouragement ?? '',
    generatedAt: raw.generatedAt ?? Date.now(),
  };
}
