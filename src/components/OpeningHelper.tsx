import { useState } from 'react';
import { useWritingStore } from '@/stores/writingStore';
import { navigate } from '@/lib/route';
import { WRITING_TYPE_META } from '@/data/writingTypes';
import { fetchOpenings } from '@/services/ai';

export default function OpeningHelper() {
  const type = useWritingStore((s) => s.type);
  const grade = useWritingStore((s) => s.grade);
  const topic = useWritingStore((s) => s.topic);
  const setTopic = useWritingStore((s) => s.setTopic);
  const openingSuggestions = useWritingStore((s) => s.openingSuggestions);
  const setOpeningSuggestions = useWritingStore((s) => s.setOpeningSuggestions);
  const createWriting = useWritingStore((s) => s.createWriting);
  const loading = useWritingStore((s) => s.loadingOpenings);
  const setLoading = useWritingStore((s) => s.setLoading);
  const setError = useWritingStore((s) => s.setError);
  const lastError = useWritingStore((s) => s.lastError);

  const [manualTopic, setManualTopic] = useState(topic ?? '');
  const [showCopiedHint, setShowCopiedHint] = useState(false);

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

  async function loadOpenings() {
    const finalTopic = manualTopic.trim() || topic || '';
    if (!finalTopic) {
      setError('주제를 한 줄 적어 주세요.');
      return;
    }
    if (!type) return;
    setTopic(finalTopic);
    setLoading('loadingOpenings', true);
    setError(null);
    try {
      const openings = await fetchOpenings({ writingType: type, grade, topic: finalTopic });
      setOpeningSuggestions(openings);
    } catch (err) {
      setError(err instanceof Error ? err.message : '첫마디를 가져오지 못했어요.');
    } finally {
      setLoading('loadingOpenings', false);
    }
  }

  // HC2: 첫마디는 자동 입력 X. 학생이 보고 자기 문장으로 직접 타이핑.
  // 클릭 시 클립보드 복사조차 안 함 (학생이 그대로 베끼는 위험 줄이기 위해).
  function onCardClick() {
    setShowCopiedHint(true);
    setTimeout(() => setShowCopiedHint(false), 2200);
  }

  async function startWriting() {
    const id = await createWriting('');
    navigate(`/edit/${id}`);
  }

  const meta = WRITING_TYPE_META[type];

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">첫마디 뽑기 — {meta.emoji} {type}</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">
          서로 다른 3가지 시작 방식을 보여 드려요. 그대로 옮기지 말고, 비슷한 느낌으로 자기 문장을 만들어 보세요.
        </p>
      </header>

      <div className="flex gap-2">
        <input
          type="text"
          value={manualTopic}
          onChange={(e) => setManualTopic(e.target.value)}
          placeholder="주제를 한 줄 적어 주세요"
          className="flex-1 rounded-full border border-[var(--color-ink-soft)]/40 px-4 py-2 bg-[var(--color-paper)] focus:outline-none focus:border-[var(--color-accent)]"
          data-testid="topic-input"
        />
        <button
          type="button"
          onClick={loadOpenings}
          disabled={loading}
          className="rounded-full px-5 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm disabled:opacity-50"
          data-testid="openings-fetch"
        >
          {loading ? '뽑는 중…' : '첫마디 뽑기'}
        </button>
      </div>

      {lastError && <p className="text-sm text-[var(--color-grade-again)]">⚠️ {lastError}</p>}

      {openingSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--color-ink-soft)] bg-[var(--color-accent-soft)] inline-block rounded-full px-3 py-1">
            💡 이 문장을 그대로 옮기지 마세요. 비슷한 느낌으로 자신의 문장을 만들어 보세요.
          </p>
          <ul className="space-y-2" data-testid="opening-list">
            {openingSuggestions.map((o, idx) => (
              <li key={`${o.approach}-${idx}`}>
                <div
                  role="presentation"
                  onClick={onCardClick}
                  className="rounded-2xl border border-[var(--color-paper-soft)] bg-[var(--color-paper-soft)]/50 p-3 cursor-default select-text"
                  data-testid="opening-card"
                  data-no-autoinsert="true"
                >
                  <div className="text-xs font-medium text-[var(--color-accent)]">{o.approach}</div>
                  <p className="mt-1 text-base">"{o.sentence}"</p>
                  <p className="text-xs text-[var(--color-ink-soft)] mt-1">{o.tone}</p>
                </div>
              </li>
            ))}
          </ul>
          {showCopiedHint && (
            <p className="text-xs text-[var(--color-ink-soft)]" role="status">
              ✋ 클릭해도 자동으로 옮겨지지 않아요. 직접 자기 문장을 타이핑해 보세요.
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={startWriting}
              className="rounded-full px-5 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm"
              data-testid="start-write"
            >
              직접 써 볼게요 →
            </button>
            <button
              type="button"
              onClick={loadOpenings}
              disabled={loading}
              className="rounded-full px-4 py-2 border border-[var(--color-ink-soft)]/40 text-sm disabled:opacity-50"
            >
              다른 후보 보기
            </button>
          </div>
        </div>
      )}

      {openingSuggestions.length === 0 && !loading && (
        <button
          type="button"
          onClick={startWriting}
          className="text-sm text-[var(--color-ink-soft)] hover:underline"
        >
          첫마디 도움 없이 바로 쓸래요 →
        </button>
      )}
    </section>
  );
}
