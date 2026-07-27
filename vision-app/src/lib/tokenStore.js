/** In-memory access token; refresh may live in sessionStorage when remember=true. */

let accessToken = null;
let refreshToken = null;
let onAuthLoss = null;

const REFRESH_KEY = 'vision.refresh';
const REMEMBER_KEY = 'vision.remember';

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setTokens({ accessToken: access, refreshToken: refresh, remember } = {}) {
  accessToken = access || null;
  refreshToken = refresh || null;
  if (typeof remember === 'boolean') {
    window.localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  }
  const shouldPersistRefresh =
    remember === true ||
    (remember === undefined && window.localStorage.getItem(REMEMBER_KEY) !== '0');
  if (refresh && shouldPersistRefresh) {
    window.sessionStorage.setItem(REFRESH_KEY, refresh);
  } else if (!refresh) {
    window.sessionStorage.removeItem(REFRESH_KEY);
  } else if (!shouldPersistRefresh) {
    window.sessionStorage.removeItem(REFRESH_KEY);
  }
}

export function loadPersistedRefresh() {
  const token = window.sessionStorage.getItem(REFRESH_KEY);
  if (token) refreshToken = token;
  return token;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  window.sessionStorage.removeItem(REFRESH_KEY);
}

export function getRememberPreference() {
  return window.localStorage.getItem(REMEMBER_KEY) !== '0';
}

export function setAuthLossHandler(handler) {
  onAuthLoss = handler;
}

export function notifyAuthLoss() {
  clearTokens();
  if (onAuthLoss) onAuthLoss();
}
