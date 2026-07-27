const DEFAULT_NAV = { module: 'home', params: {} };

export function readNavigation() {
  if (typeof window === 'undefined') return DEFAULT_NAV;
  const search = new URLSearchParams(window.location.search);
  const module = search.get('view') || DEFAULT_NAV.module;
  const params = {};
  search.forEach((value, key) => {
    if (key !== 'view') params[key] = value;
  });
  return { module, params };
}

export function navigationUrl({ module, params = {} }) {
  const search = new URLSearchParams();
  if (module && module !== 'home') search.set('view', module);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const query = search.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
}

export function writeNavigation(nav, { replace = false } = {}) {
  if (typeof window === 'undefined') return;
  const url = navigationUrl(nav);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (url === current) return;
  window.history[replace ? 'replaceState' : 'pushState']({ nav }, '', url);
}
