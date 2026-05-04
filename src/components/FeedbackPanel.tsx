import type { Feedback, FeedbackArea, Grade } from '@/types/writing';
import {
  FEEDBACK_AREA_LABEL,
  FEEDBACK_AREA_COLOR,
  GRADE_COLOR,
} from '@/types/writing';

const AREA_KEYS: FeedbackArea[] = ['spelling', 'structure', 'context', 'expression'];

const GRADE_PATTERN: Record<Grade, string> = {
  잘함: 'solid',
  괜찮음: 'dashed',
  노력: 'dotted',
  다시: 'double',
};

const GRADE_EMOJI: Record<Grade, string> = {
  잘함: '🌟',
  괜찮음: '🙂',
  노력: '💪',
  다시: '🔁',
};

export default function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  return (
    <div className="space-y-4" data-testid="feedback-panel">
      {/* 잘한 점 (가장 강조) */}
      <div
        className="rounded-2xl p-4 border-2"
        style={{
          background: 'rgb(from var(--color-grade-best) r g b / 0.10)',
          borderColor: 'rgb(from var(--color-grade-best) r g b / 0.45)',
        }}
        data-testid="praise-card"
      >
        <div className="text-xs font-medium text-[var(--color-ink-soft)] mb-1">잘한 점</div>
        <p className="text-base leading-relaxed">🌟 {feedback.praise}</p>
      </div>

      {/* 4영역 등급 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="scores-grid">
        {AREA_KEYS.map((area) => {
          const grade = feedback.scores[area];
          return (
            <div
              key={area}
              className="rounded-2xl p-3 border bg-[var(--color-paper-soft)]/50"
              style={{
                borderColor: 'rgb(from var(--color-paper-soft) r g b / 0.8)',
                borderLeftWidth: 4,
                borderLeftStyle: GRADE_PATTERN[grade] as 'solid' | 'dashed' | 'dotted' | 'double',
                borderLeftColor: FEEDBACK_AREA_COLOR[area],
              }}
              data-testid={`score-${area}`}
            >
              <div className="text-xs text-[var(--color-ink-soft)]">{FEEDBACK_AREA_LABEL[area]}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg">{GRADE_EMOJI[grade]}</span>
                <span
                  className="font-semibold"
                  style={{ color: GRADE_COLOR[grade] }}
                  data-grade={grade}
                >
                  {grade}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 격려 한 줄 */}
      <div
        className="rounded-2xl p-4 border"
        style={{
          background: 'rgb(from var(--color-accent) r g b / 0.08)',
          borderColor: 'rgb(from var(--color-accent) r g b / 0.30)',
        }}
        data-testid="encouragement-card"
      >
        <p className="text-base leading-relaxed">💌 {feedback.encouragement}</p>
      </div>

      <p className="text-[11px] text-[var(--color-ink-soft)]">
        ※ 점수가 아닌 4단계 단어로 표시해요. 친구나 다른 글과 비교하지 않아요.
      </p>
    </div>
  );
}
