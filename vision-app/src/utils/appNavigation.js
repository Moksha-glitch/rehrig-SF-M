const DEFAULT_NAV = { module: 'home', params: {} };
const RETURN_PARAM_PREFIX = 'return_';

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

/** Build onboarding route params with optional draftId and return navigation. */
export function onboardingNavParams({ draftId = null, from = DEFAULT_NAV } = {}) {
  const params = {};
  if (draftId) params.draftId = draftId;
  const returnModule =
    from?.module && from.module !== 'onboarding' ? from.module : DEFAULT_NAV.module;
  params.returnView = returnModule;
  Object.entries(from?.params || {}).forEach(([key, value]) => {
    if (
      key === 'draftId' ||
      key === 'returnView' ||
      key.startsWith(RETURN_PARAM_PREFIX) ||
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return;
    }
    params[`${RETURN_PARAM_PREFIX}${key}`] = value;
  });
  return params;
}

/** Restore the route to open after leaving guided onboarding. */
export function parseOnboardingReturn(params = {}) {
  const module =
    params.returnView && params.returnView !== 'onboarding'
      ? params.returnView
      : DEFAULT_NAV.module;
  const returnParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (key.startsWith(RETURN_PARAM_PREFIX)) {
      returnParams[key.slice(RETURN_PARAM_PREFIX.length)] = value;
    }
  });
  return { module, params: returnParams };
}
