import { useEffect, useState } from 'react';
import { deleteWriting, listWritings } from '@/services/db';
import type { Writing } from '@/types/writing';
import { WRITING_TYPE_META } from '@/data/writingTypes';

export default function MyWritings() {
  const [items, setItems] = useState<Writing[] | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    listWritings().then(setItems);
  }, [refreshTick]);

  async function onDelete(id: string) {
    if (!confirm('이 글을 영구 삭제할까요? 되돌릴 수 없어요.')) return;
    await deleteWriting(id);
    setRefreshTick((v) => v + 1);
  }

  if (items === null) {
    return <p className="text-[var(--color-ink-soft)]">불러오는 중…</p>;
  }

  if (items.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">내 글 목록</h2>
        <p className="text-[var(--color-ink-soft)]">아직 쓴 글이 없어요.</p>
        <a
          className="rounded-full px-5 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] inline-block"
          href="#/new"
        >
          첫 글 시작하기
        </a>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">내 글 목록 ({items.length})</h2>
      <ul className="space-y-2">
        {items.map((w) => {
          const meta = WRITING_TYPE_META[w.type];
          const last = w.revisions[w.revisions.length - 1];
          const preview = (last?.text ?? '').slice(0, 60).replace(/\s+/g, ' ');
          return (
            <li
              key={w.id}
              className="rounded-2xl border border-[var(--color-paper-soft)] bg-[var(--color-paper-soft)]/50 p-4 flex items-start gap-3"
            >
              <span className="text-2xl shrink-0">{meta.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold">{w.type}</span>
                  {w.topic && <span className="text-sm text-[var(--color-ink-soft)]">— {w.topic}</span>}
                  <span className="text-xs text-[var(--color-ink-soft)] ml-auto">
                    회차 {w.revisions.length}/5 · {new Date(w.updatedAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                {preview && <p className="text-sm text-[var(--color-ink-soft)] mt-1 truncate">{preview}…</p>}
                <div className="flex gap-2 mt-2">
                  <a
                    className="rounded-full px-3 py-1 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm"
                    href={`#/edit/${w.id}`}
                  >
                    이어 쓰기
                  </a>
                  {last?.feedback && (
                    <a
                      className="rounded-full px-3 py-1 border border-[var(--color-ink-soft)]/40 text-sm"
                      href={`#/feedback/${w.id}`}
                    >
                      첨삭 결과
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(w.id)}
                    className="rounded-full px-3 py-1 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-grade-again)]"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
