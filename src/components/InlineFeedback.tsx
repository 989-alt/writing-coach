import { useMemo, useState } from 'react';
import type { FeedbackArea, InlineMark } from '@/types/writing';
import { FEEDBACK_AREA_COLOR, FEEDBACK_AREA_LABEL } from '@/types/writing';

interface Props {
  text: string;
  marks: InlineMark[];
}

interface Segment {
  text: string;
  marks: InlineMark[]; // 같은 위치에 여러 영역이 겹칠 수 있어 배열
}

/**
 * text를 인라인 마킹된 segment 배열로 분해.
 * snippet이 본문에서 발견되면 해당 위치를 마킹. 중첩되는 경우 가장 안쪽까지 처리.
 */
function buildSegments(text: string, marks: InlineMark[]): Segment[] {
  if (marks.length === 0) return [{ text, marks: [] }];
  // 1) 각 mark의 위치를 찾는다 (중복 가능). 같은 snippet이 여러 번 나오면 첫 위치만.
  const ranges: { start: number; end: number; mark: InlineMark }[] = [];
  for (const m of marks) {
    if (!m.snippet) continue;
    const idx = text.indexOf(m.snippet);
    if (idx === -1) continue;
    ranges.push({ start: idx, end: idx + m.snippet.length, mark: m });
  }
  if (ranges.length === 0) return [{ text, marks: [] }];

  // 2) 경계점(boundary)을 모아 정렬
  const boundaries = new Set<number>();
  boundaries.add(0);
  boundaries.add(text.length);
  for (const r of ranges) {
    boundaries.add(r.start);
    boundaries.add(r.end);
  }
  const sorted = Array.from(boundaries).sort((a, b) => a - b);

  // 3) 각 구간마다 어떤 mark에 포함되는지 판정
  const segs: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a === b) continue;
    const piece = text.slice(a, b);
    const here = ranges.filter((r) => r.start <= a && r.end >= b).map((r) => r.mark);
    segs.push({ text: piece, marks: here });
  }
  return segs;
}

const AREA_BG: Record<FeedbackArea, string> = {
  spelling: 'rgb(from var(--color-spelling) r g b / 0.18)',
  structure: 'rgb(from var(--color-structure) r g b / 0.18)',
  context: 'rgb(from var(--color-context) r g b / 0.18)',
  expression: 'rgb(from var(--color-expression) r g b / 0.18)',
};

const AREA_BORDER: Record<FeedbackArea, string> = {
  spelling: 'var(--color-spelling)',
  structure: 'var(--color-structure)',
  context: 'var(--color-context)',
  expression: 'var(--color-expression)',
};

export default function InlineFeedback({ text, marks }: Props) {
  const segments = useMemo(() => buildSegments(text, marks), [text, marks]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // 매핑되지 않은 mark (snippet 본문 미일치) 별도 표시
  const unmappedMarks = useMemo(
    () => marks.filter((m) => !m.snippet || text.indexOf(m.snippet) === -1),
    [text, marks],
  );

  return (
    <div
      className="rounded-2xl border border-[var(--color-paper-soft)] bg-[var(--color-paper)] p-4 space-y-3"
      data-testid="inline-feedback"
    >
      <div className="flex flex-wrap gap-2 text-xs">
        {(['spelling', 'structure', 'context', 'expression'] as FeedbackArea[]).map((a) => (
          <span key={a} className="inline-flex items-center gap-1">
            <span
              aria-hidden
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: FEEDBACK_AREA_COLOR[a] }}
            />
            {FEEDBACK_AREA_LABEL[a]}
          </span>
        ))}
      </div>

      <p className="whitespace-pre-wrap leading-relaxed text-base">
        {segments.map((seg, i) => {
          if (seg.marks.length === 0) return <span key={i}>{seg.text}</span>;
          // 여러 영역 겹침 시 첫 영역으로 색상, 추가 영역은 underline pattern
          const primary = seg.marks[0].area;
          const isActive = activeIdx === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(isActive ? null : i)}
              data-testid={`mark-${primary}`}
              className="rounded-md px-0.5 transition cursor-pointer text-left"
              style={{
                background: AREA_BG[primary],
                borderBottom: `2px solid ${AREA_BORDER[primary]}`,
                outline: isActive ? `2px solid ${AREA_BORDER[primary]}` : 'none',
              }}
            >
              {seg.text}
            </button>
          );
        })}
      </p>

      {activeIdx !== null && segments[activeIdx]?.marks.length > 0 && (
        <div
          role="tooltip"
          className="rounded-xl border border-[var(--color-paper-soft)] bg-[var(--color-paper-soft)]/70 p-3 text-sm space-y-2"
          data-testid="mark-tooltip"
        >
          {segments[activeIdx].marks.map((m, k) => (
            <div key={k} className="space-y-0.5">
              <div className="text-xs font-medium" style={{ color: AREA_BORDER[m.area] }}>
                {FEEDBACK_AREA_LABEL[m.area]}
              </div>
              <div>{m.comment}</div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setActiveIdx(null)}
            className="text-xs text-[var(--color-ink-soft)] hover:underline"
          >
            닫기
          </button>
        </div>
      )}

      {unmappedMarks.length > 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-paper-soft)] p-3 text-sm space-y-1">
          <p className="text-xs text-[var(--color-ink-soft)]">본문 위치를 찾지 못한 제안</p>
          <ul className="list-disc pl-5">
            {unmappedMarks.map((m, i) => (
              <li key={i}>
                <span className="text-xs font-medium" style={{ color: AREA_BORDER[m.area] }}>
                  {FEEDBACK_AREA_LABEL[m.area]}
                </span>{' '}
                — {m.comment}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
