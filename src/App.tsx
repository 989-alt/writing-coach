import { useEffect, useState } from 'react';
import { parseHash, type Route } from '@/lib/route';
import { cycle as cycleTheme, getTheme, type Theme } from '@/lib/theme';
import Home from '@/components/Home';
import WritingTypeSelect from '@/components/WritingTypeSelect';
import TopicFinder from '@/components/TopicFinder';
import OpeningHelper from '@/components/OpeningHelper';
import Editor from '@/components/Editor';
import FeedbackView from '@/components/FeedbackView';
import MyWritings from '@/components/MyWritings';

function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

export default function App() {
  const route = useHashRoute();
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  return (
    <div className="min-h-full">
      <header className="border-b border-[var(--color-paper-soft)] bg-[var(--color-paper)]/90 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <a href="#/" className="font-semibold text-[var(--color-ink)]">
            Writing Coach
          </a>
          <span className="text-xs text-[var(--color-ink-soft)] hidden sm:inline">
            학생이 쓰고 · AI는 코치
          </span>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setThemeState(cycleTheme())}
              className="rounded-full border border-[var(--color-ink-soft)]/30 px-3 py-1 text-xs text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-soft)]"
              data-testid="theme-toggle"
              aria-label={`테마: ${theme === 'system' ? '자동' : theme === 'light' ? '라이트' : '다크'}`}
            >
              {theme === 'system' ? '🖥️ 자동' : theme === 'light' ? '☀️ 라이트' : '🌙 다크'}
            </button>
            <a className="hover:underline text-[var(--color-ink-soft)]" href="#/list">
              내 글
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8" data-testid={`route-${route.name}`}>
        <RouteView route={route} />
      </main>
      <footer className="mx-auto max-w-3xl px-4 py-6 text-xs text-[var(--color-ink-soft)] space-y-1">
        <p>© 2026 Writing Coach · 학생 글은 이 브라우저에만 저장돼요 (서버 저장 0)</p>
        <p>점수·랭킹·타인 비교 없음 · 본문 자동 작성 없음 · 광고/결제/SNS 공유 없음</p>
      </footer>
    </div>
  );
}

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'new':
      return <WritingTypeSelect />;
    case 'topic':
      return <TopicFinder />;
    case 'opening':
      return <OpeningHelper />;
    case 'edit':
      return <Editor writingId={route.id} />;
    case 'feedback':
      return <FeedbackView writingId={route.id} />;
    case 'list':
      return <MyWritings />;
  }
}
