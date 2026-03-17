/**
 * Consolidated admin email list — single source of truth.
 */
export const ADMIN_EMAILS = [
  "admin@legacy-loop.com",
  "ryan@legacy-loop.com",
  "ryan@legacyloop.com",
  "admin@legacyloop.com",
  "ryanhallee@gmail.com",
];

export function isAdmin(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes(email ?? "");
}
