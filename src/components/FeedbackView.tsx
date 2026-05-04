import { useEffect, useState } from 'react';
import { db, saveWriting } from '@/services/db';
import type { Writing } from '@/types/writing';
import { useWritingStore } from '@/stores/writingStore';
import InlineFeedback from '@/components/InlineFeedback';
import FeedbackPanel from '@/components/FeedbackPanel';
import RevisionFlow from '@/components/RevisionFlow';
import RevisionCompare from '@/components/RevisionCompare';
import { exportFeedbackPdf } from '@/services/pdf';
import { fetchFeedback } from '@/services/ai';
import { humanizeAiError } from '@/lib/apiKeyBridge';

interface Props {
  writingId: string;
}

export default function FeedbackView({ writingId }: Props) {
  const [writing, setWriting] = useState<Writing | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const loading = useWritingStore((s) => s.loadingFeedback);
  const setLoading = useWritingStore((s) => s.setLoading);
  const setError = useWritingStore((s) => s.setError);
  const lastError = useWritingStore((s) => s.lastError);

  useEffect(() => {
    db.writings.get(writingId).then((w) => {
      if (w) setWriting(w);
      else setError(`글(${writingId})을 찾을 수 없습니다.`);
    });
  }, [writingId, refreshTick, setError]);

  const lastRevision = writing?.revisions[writing.revisions.length - 1];

  // 마지막 회차에 feedback이 없으면 자동으로 분석 호출 (사용자가 #/feedback/:id로 진입한 경우)
  useEffect(() => {
    if (!writing || !lastRevision) return;
    if (lastRevision.feedback !== null) return;
    if (loading) return;
    if (!lastRevision.text || lastRevision.text.length < 30) {
      setError('30자 이상 작성된 글만 분석할 수 있어요.');
      return;
    }
    void analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writing?.id, lastRevision?.feedback]);

  async function analyze() {
    if (!writing || !lastRevision) return;
    setLoading('loadingFeedback', true);
    setError(null);
    try {
      const feedback = await fetchFeedback({
        writingType: writing.type,
        grade: writing.grade,
        text: lastRevision.text,
      });
      const w = await db.writings.get(writingId);
      if (!w) return;
      const last = w.revisions[w.revisions.length - 1];
      if (!last) return;
      last.feedback = feedback;
      last.timestamp = Date.now();
      await saveWriting(w);
      setRefreshTick((v) => v + 1);
    } catch (err) {
      setError(humanizeAiError(err));
    } finally {
      setLoading('loadingFeedback', false);
    }
  }

  if (!writing) {
    return <p className="text-[var(--color-ink-soft)]">불러오는 중…</p>;
  }
  if (!lastRevision) {
    return <p className="text-[var(--color-grade-again)]">회차 정보가 없습니다.</p>;
  }

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">
          첨삭 결과 — {writing.type}
          {writing.topic ? ` · ${writing.topic}` : ''}
        </h2>
        <p className="text-sm text-[var(--color-ink-soft)]">
          회차 {lastRevision.index}/{Math.max(5, lastRevision.index)} · 잘한 점부터 보고, 색칠된 부분을 참고해 직접 고쳐 보세요.
        </p>
      </header>

      {loading && (
        <p className="text-sm text-[var(--color-ink-soft)]" data-testid="feedback-loading">
          ⏳ 4영역으로 천천히 살펴보는 중이에요…
        </p>
      )}
      {lastError && !loading && (
        <div className="rounded-2xl border border-[var(--color-grade-again)]/40 p-4 space-y-2">
          <p className="text-sm text-[var(--color-grade-again)]">⚠️ {lastError}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              void analyze();
            }}
            className="rounded-full px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm"
          >
            다시 시도
          </button>
        </div>
      )}

      {lastRevision.feedback && (
        <>
          <FeedbackPanel feedback={lastRevision.feedback} />
          <InlineFeedback text={lastRevision.text} marks={lastRevision.feedback.inlineMarks} />
          <RevisionCompare writing={writing} />
          <RevisionFlow
            writing={writing}
            onRevisionStarted={(newId) => {
              window.location.hash = `#/edit/${newId}`;
            }}
            onRefresh={() => setRefreshTick((v) => v + 1)}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => exportFeedbackPdf(writing)}
              className="rounded-full px-5 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm"
              data-testid="pdf-btn"
            >
              PDF로 저장
            </button>
            <a
              className="rounded-full px-5 py-2 border border-[var(--color-ink-soft)]/40 text-sm"
              href="#/list"
            >
              내 글 목록
            </a>
          </div>
        </>
      )}
    </section>
  );
}
