import type { FeedbackArea, Grade, Writing } from '@/types/writing';
import { FEEDBACK_AREA_LABEL, GRADE_COLOR } from '@/types/writing';

const AREA_KEYS: FeedbackArea[] = ['spelling', 'structure', 'context', 'expression'];

const GRADE_RANK: Record<Grade, number> = {
  다시: 1,
  노력: 2,
  괜찮음: 3,
  잘함: 4,
};

function diff(prev: Grade | undefined, cur: Grade | undefined) {
  if (!prev || !cur) return 0;
  return GRADE_RANK[cur] - GRADE_RANK[prev];
}

export default function RevisionCompare({ writing }: { writing: Writing }) {
  if (writing.revisions.length < 2) return null;
  const completed = writing.revisions.filter((r) => r.feedback);
  if (completed.length < 2) return null;

  return (
    <div
      className="rounded-2xl border border-[var(--color-paper-soft)] bg-[var(--color-paper)] p-4 space-y-3"
      data-testid="revision-compare"
    >
      <p className="text-sm font-medium">회차 비교</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs text-[var(--color-ink-soft)] border-b border-[var(--color-paper-soft)]">
              <th className="text-left py-2 pr-3">영역</th>
              {completed.map((r) => (
                <th key={r.index} className="text-left py-2 pr-3">
                  {r.index}회
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AREA_KEYS.map((area) => (
              <tr key={area} className="border-b border-[var(--color-paper-soft)]/60 last:border-0">
                <td className="py-2 pr-3 text-[var(--color-ink-soft)]">{FEEDBACK_AREA_LABEL[area]}</td>
                {completed.map((r, i) => {
                  const cur = r.feedback?.scores[area];
                  const prev = i > 0 ? completed[i - 1].feedback?.scores[area] : undefined;
                  const d = diff(prev, cur);
                  return (
                    <td key={r.index} className="py-2 pr-3">
                      {cur && (
                        <span
                          className="font-medium"
                          style={{ color: GRADE_COLOR[cur] }}
                        >
                          {cur}
                        </span>
                      )}
                      {d > 0 && <span className="ml-1 text-xs text-[var(--color-grade-best)]">↑ 발전</span>}
                      {d < 0 && <span className="ml-1 text-xs text-[var(--color-ink-soft)]">↓</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
