import { useEffect, useState } from 'react';
import { listWritings } from '@/services/db';

export default function Home() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    listWritings().then((all) => setCount(all.length));
  }, []);

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
          글의 시작을 도와주는 친구,
          <br />
          <span className="text-[var(--color-accent)]">Writing Coach</span>
        </h1>
        <p className="text-[var(--color-ink-soft)] max-w-prose">
          글감이 막막할 때 함께 찾아 주고, 첫 문장은 살짝만 거들어요. 본문은 여러분이 직접 써요.
          그리고 다 쓴 글은 4영역(맞춤법·구조·맥락·표현)으로 따뜻하게 첨삭해 드릴게요.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          className="rounded-full px-5 py-3 bg-[var(--color-ink)] text-[var(--color-paper)] font-medium hover:opacity-90 transition"
          href="#/new"
          data-testid="cta-start"
        >
          글쓰기 시작 →
        </a>
        <a
          className="rounded-full px-5 py-3 border border-[var(--color-ink-soft)]/40 hover:bg-[var(--color-paper-soft)] transition"
          href="#/list"
          data-testid="cta-list"
        >
          내 글 목록{count !== null ? ` (${count})` : ''}
        </a>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 pt-4">
        <Feature
          emoji="🌱"
          title="글감 찾기"
          desc="키워드 한두 개만 알려주면 8개 글감을 함께 찾아 드려요."
        />
        <Feature
          emoji="✏️"
          title="첫마디 뽑기"
          desc="시작이 막막할 때 3가지 첫 문장을 보여 드려요. 그대로 쓰지 말고 자기 문장으로 바꿔 보세요."
        />
        <Feature
          emoji="📝"
          title="4영역 첨삭"
          desc="맞춤법·구조·맥락·표현을 색깔로 알려 드려요. 점수 매기지 않아요."
        />
        <Feature
          emoji="🔁"
          title="자가 첨삭"
          desc="고친 글은 다시 분석할 수 있어요. 최대 5회까지 모아서 변화를 볼 수 있어요."
        />
      </div>
    </section>
  );
}

function Feature({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-paper-soft)] bg-[var(--color-paper-soft)]/50 p-4">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-2 font-semibold">{title}</h3>
      <p className="text-sm text-[var(--color-ink-soft)] mt-1">{desc}</p>
    </div>
  );
}
