/**
 * Safe JSON parser — returns parsed object or null on failure.
 * Centralizes the pattern used across 10+ files.
 */
export function safeJson<T = any>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
