import { useState } from 'react';
import { WRITING_TYPE_LIST } from '@/data/writingTypes';
import { UNITS_BY_TYPE } from '@/data/units';
import type { Grade4, WritingType } from '@/types/writing';
import { useWritingStore } from '@/stores/writingStore';
import { navigate } from '@/lib/route';

export default function WritingTypeSelect() {
  const setType = useWritingStore((s) => s.setType);
  const setGrade = useWritingStore((s) => s.setGrade);
  const grade = useWritingStore((s) => s.grade);
  const createWriting = useWritingStore((s) => s.createWriting);
  const [expanded, setExpanded] = useState<WritingType | null>(null);
  const [busy, setBusy] = useState(false);

  async function chooseAndStart(type: WritingType, route: 'topic' | 'opening' | 'edit') {
    if (busy) return;
    setBusy(true);
    try {
      setType(type);
      if (route === 'edit') {
        const id = await createWriting('');
        navigate(`/edit/${id}`);
      } else if (route === 'topic') {
        navigate('/topic');
      } else {
        navigate('/opening');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">어떤 글을 써 볼까요?</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">
          글 종류를 고르면 22개정 교육과정 단원과 권장 길이를 함께 알려 드려요.
        </p>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-[var(--color-ink-soft)]">학년 (선택):</span>
        <div className="flex gap-1">
          {[3, 4, 5, 6].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(grade === g ? undefined : (g as Grade4))}
              className={
                'rounded-full border px-3 py-1 text-sm transition ' +
                (grade === g
                  ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-transparent'
                  : 'border-[var(--color-ink-soft)]/40 hover:bg-[var(--color-paper-soft)]')
              }
            >
              {g}학년
            </button>
          ))}
        </div>
      </div>

      <ul className="grid sm:grid-cols-2 gap-3">
        {WRITING_TYPE_LIST.map((meta) => {
          const isOpen = expanded === meta.type;
          const units = UNITS_BY_TYPE[meta.type];
          return (
            <li
              key={meta.type}
              className="rounded-2xl border border-[var(--color-paper-soft)] bg-[var(--color-paper-soft)]/50 p-4 hover:border-[var(--color-accent)]/60 transition"
              data-testid={`type-card-${meta.type}`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpanded(isOpen ? null : meta.type)}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-lg font-semibold">{meta.type}</span>
                  <span className="text-sm text-[var(--color-ink-soft)]">— {meta.short}</span>
                </div>
                <p className="text-sm text-[var(--color-ink-soft)] mt-1">{meta.description}</p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-2">
                  권장 {meta.recommendedLength.min}~{meta.recommendedLength.max}자
                </p>
              </button>

              {isOpen && (
                <div className="mt-3 border-t border-[var(--color-paper-soft)] pt-3 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-ink-soft)]">글의 짜임</p>
                    <p className="text-sm">{meta.structureGuide}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-ink-soft)]">관련 단원 (22개정)</p>
                    <ul className="text-sm space-y-1">
                      {units.map((u) => (
                        <li key={u.unitTitle}>
                          · {u.unitTitle}
                          <span className="block text-xs text-[var(--color-ink-soft)] pl-2">
                            성취기준: {u.achievement}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => chooseAndStart(meta.type, 'topic')}
                      className="rounded-full px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm hover:opacity-90"
                      data-testid="start-topic"
                    >
                      글감 찾기 도움받기
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseAndStart(meta.type, 'opening')}
                      className="rounded-full px-4 py-2 border border-[var(--color-ink-soft)]/40 text-sm hover:bg-[var(--color-paper-soft)]"
                    >
                      첫마디만 도움받기
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseAndStart(meta.type, 'edit')}
                      className="rounded-full px-4 py-2 border border-[var(--color-ink-soft)]/40 text-sm hover:bg-[var(--color-paper-soft)]"
                      data-testid="start-direct"
                    >
                      바로 쓰기
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
