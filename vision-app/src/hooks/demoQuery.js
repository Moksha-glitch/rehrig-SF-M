/**
 * @deprecated Internal to `src/backends/demo/hooks/queryShape.js`.
 * Do not import from screens — use mode hooks via `src/hooks/*`.
 */
export function demoQuery() {
  throw new Error('demoQuery is demo-backend internal. Import hooks from src/hooks instead.');
}

export function demoMutation() {
  throw new Error('demoMutation is demo-backend internal. Import hooks from src/hooks instead.');
}
