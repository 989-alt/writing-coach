import { useState } from 'react';
import type { Writing } from '@/types/writing';
import { db, saveWriting } from '@/services/db';

interface Props {
  writing: Writing;
  onRevisionStarted(id: string): void;
  onRefresh(): void;
}

const MAX_REVISIONS = 5;

export default function RevisionFlow({ writing, onRevisionStarted, onRefresh }: Props) {
  const [notice, setNotice] = useState<string | null>(null);

  async function startNewRevision() {
    const w = await db.writings.get(writing.id);
    if (!w) return;
    const last = w.revisions[w.revisions.length - 1];
    if (!last) return;

    // 마지막 회차가 아직 분석되지 않았으면(=비어있는 회차이면) 거기로 그대로 이동.
    // 동일 본문 중복 회차 생성 방지.
    if (last.feedback === null) {
      onRevisionStarted(w.id);
      return;
    }

    if (w.revisions.length >= MAX_REVISIONS) {
      setNotice('회차는 최대 5회까지 보관돼요. 마지막 회차에 이어서 고쳐 주세요.');
      last.feedback = null;
      last.timestamp = Date.now();
    } else {
      w.revisions.push({
        index: w.revisions.length + 1,
        text: last.text,
        feedback: null,
        timestamp: Date.now(),
      });
    }
    await saveWriting(w);
    onRefresh();
    onRevisionStarted(w.id);
  }

  return (
    <div
      className="rounded-2xl border border-[var(--color-paper-soft)] bg-[var(--color-paper-soft)]/40 p-4 space-y-2"
      data-testid="revision-flow"
    >
      <p className="text-sm font-medium">자가 첨삭</p>
      <p className="text-xs text-[var(--color-ink-soft)]">
        회차 {writing.revisions.length}/5. 글을 고친 다음 다시 분석하면 4영역 등급 변화가 모여요.
      </p>
      {notice && <p className="text-xs text-[var(--color-ink-soft)]" role="status">{notice}</p>}
      <button
        type="button"
        onClick={startNewRevision}
        className="rounded-full px-4 py-2 border border-[var(--color-ink-soft)]/40 text-sm hover:bg-[var(--color-paper)]"
        data-testid="revise-btn"
      >
        글 고치고 다시 분석하기
      </button>
    </div>
  );
}
