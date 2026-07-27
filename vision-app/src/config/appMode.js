/** App runtime mode: `demo` (local seed) or `api` (vision-api + JWT). */

export function getAppMode() {
  const mode = (import.meta.env.VITE_APP_MODE || 'demo').toLowerCase();
  return mode === 'api' ? 'api' : 'demo';
}

export function isApiMode() {
  return getAppMode() === 'api';
}

export function isDemoMode() {
  return getAppMode() === 'demo';
}

export function appModeLabel() {
  return isApiMode() ? 'API' : 'Demo';
}
