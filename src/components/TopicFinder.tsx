import { useState } from 'react';
import { useWritingStore } from '@/stores/writingStore';
import { navigate } from '@/lib/route';
import { WRITING_TYPE_META } from '@/data/writingTypes';

export default function TopicFinder() {
  const type = useWritingStore((s) => s.type);
  const grade = useWritingStore((s) => s.grade);
  const keywords = useWritingStore((s) => s.keywords);
  const setKeywords = useWritingStore((s) => s.setKeywords);
  const topicSuggestions = useWritingStore((s) => s.topicSuggestions);
  const setTopicSuggestions = useWritingStore((s) => s.setTopicSuggestions);
  const setTopic = useWritingStore((s) => s.setTopic);
  const loading = useWritingStore((s) => s.loadingTopics);
  const setLoading = useWritingStore((s) => s.setLoading);
  const setError = useWritingStore((s) => s.setError);
  const lastError = useWritingStore((s) => s.lastError);
  const [shake, setShake] = useState(false);

  if (!type) {
    return (
      <section className="space-y-3">
        <p>먼저 글 종류를 골라 주세요.</p>
        <a
          className="rounded-full px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm inline-block"
          href="#/new"
        >
          글 종류 고르기
        </a>
      </section>
    );
  }

  async function fetchTopics() {
    if (!keywords.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setLoading('loadingTopics', true);
    setError(null);
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ writingType: type, grade, keywords }),
      });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data = await res.json();
      if (!Array.isArray(data?.topics)) throw new Error('AI 응답 형식이 올바르지 않아요.');
      setTopicSuggestions(data.topics);
    } catch (err) {
      setError(err instanceof Error ? err.message : '글감을 가져오지 못했어요.');
    } finally {
      setLoading('loadingTopics', false);
    }
  }

  function chooseTopic(title: string) {
    setTopic(title);
    navigate('/opening');
  }

  const meta = WRITING_TYPE_META[type];

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">글감 찾기 — {meta.emoji} {type}</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">
          키워드를 1~2개만 알려 주면 어울리는 글감을 6~8개 함께 찾아 드릴게요.
        </p>
      </header>

      <div className={'flex gap-2 ' + (shake ? 'animate-pulse' : '')}>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) fetchTopics();
          }}
          placeholder="예: 환경 보호, 우리 동네, 책 제목 …"
          className="flex-1 rounded-full border border-[var(--color-ink-soft)]/40 px-4 py-2 bg-[var(--color-paper)] focus:outline-none focus:border-[var(--color-accent)]"
          data-testid="keywords-input"
        />
        <button
          type="button"
          onClick={fetchTopics}
          disabled={loading}
          className="rounded-full px-5 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm disabled:opacity-50"
          data-testid="topics-fetch"
        >
          {loading ? '찾는 중…' : '글감 찾기'}
        </button>
      </div>

      {lastError && <p className="text-sm text-[var(--color-grade-again)]">⚠️ {lastError}</p>}

      {topicSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--color-ink-soft)]">
            마음에 드는 글감을 골라 보세요. 마음에 안 들면 다시 찾을 수 있어요.
          </p>
          <ul className="grid sm:grid-cols-2 gap-2" data-testid="topic-list">
            {topicSuggestions.map((t, idx) => (
              <li key={`${t.title}-${idx}`}>
                <button
                  type="button"
                  onClick={() => chooseTopic(t.title)}
                  className="w-full text-left rounded-2xl border border-[var(--color-paper-soft)] bg-[var(--color-paper-soft)]/50 p-3 hover:border-[var(--color-accent)]/60"
                >
                  <div className="font-medium">{t.title}</div>
                  <p className="text-sm text-[var(--color-ink-soft)] mt-1">{t.description}</p>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={fetchTopics}
              disabled={loading}
              className="rounded-full px-4 py-2 border border-[var(--color-ink-soft)]/40 text-sm hover:bg-[var(--color-paper-soft)] disabled:opacity-50"
            >
              마음에 안 들어요, 다시 찾기
            </button>
            <button
              type="button"
              onClick={() => navigate('/opening')}
              className="rounded-full px-4 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-soft)]"
            >
              직접 정할래요 →
            </button>
          </div>
        </div>
      )}

      {topicSuggestions.length === 0 && !loading && (
        <button
          type="button"
          onClick={() => navigate('/opening')}
          className="text-sm text-[var(--color-ink-soft)] hover:underline"
        >
          글감은 직접 정할래요 →
        </button>
      )}
    </section>
  );
}
