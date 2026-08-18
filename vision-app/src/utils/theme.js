export const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'monitor' },
];

export function normalizeTheme(value) {
  return value === 'dark' || value === 'system' ? value : 'light';
}

export function resolveTheme(preference) {
  const pref = normalizeTheme(preference);
  if (pref !== 'system') return pref;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyResolvedTheme(preference) {
  if (typeof document === 'undefined') return resolveTheme(preference);
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function subscribeSystemTheme(preference, onChange) {
  if (typeof window === 'undefined' || preference !== 'system') return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => onChange(resolveTheme('system'));
  media.addEventListener('change', handleChange);
  return () => media.removeEventListener('change', handleChange);
}
