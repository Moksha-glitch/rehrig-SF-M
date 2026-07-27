/** Shared error message helper — no network client dependency. */

export function getErrorMessage(error, fallback = 'Request failed. Please try again.') {
  return error?.userMessage || error?.response?.data?.message || error?.message || fallback;
}
