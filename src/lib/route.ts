export type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'topic' }
  | { name: 'opening' }
  | { name: 'edit'; id: string }
  | { name: 'feedback'; id: string }
  | { name: 'list' };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#/, '').trim();
  if (clean === '' || clean === '/') return { name: 'home' };
  const parts = clean.replace(/^\//, '').split('/');
  switch (parts[0]) {
    case 'new':
      return { name: 'new' };
    case 'topic':
      return { name: 'topic' };
    case 'opening':
      return { name: 'opening' };
    case 'edit':
      return { name: 'edit', id: parts[1] ?? '' };
    case 'feedback':
      return { name: 'feedback', id: parts[1] ?? '' };
    case 'list':
      return { name: 'list' };
    default:
      return { name: 'home' };
  }
}

export function navigate(path: string): void {
  if (!path.startsWith('#')) path = '#' + path;
  if (window.location.hash !== path) {
    window.location.hash = path;
  } else {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}
