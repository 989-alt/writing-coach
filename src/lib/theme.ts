// 라이트/다크 토글. 시스템 기본값을 따르되 사용자 선택을 localStorage에 저장.
export type Theme = 'system' | 'light' | 'dark';

const KEY = 'writing-coach.theme';

export function getTheme(): Theme {
  const v = (typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null) as Theme | null;
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

export function setTheme(t: Theme) {
  localStorage.setItem(KEY, t);
  apply(t);
}

export function apply(t: Theme = getTheme()) {
  const root = document.documentElement;
  root.dataset.theme = t === 'system' ? '' : t;
  if (t === 'system') {
    root.style.colorScheme = '';
  } else {
    root.style.colorScheme = t;
  }
}

export function cycle(): Theme {
  const cur = getTheme();
  const next: Theme = cur === 'system' ? 'light' : cur === 'light' ? 'dark' : 'system';
  setTheme(next);
  return next;
}
