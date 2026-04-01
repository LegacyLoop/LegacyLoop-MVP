/**
 * Consolidated admin email list — single source of truth.
 */
export const ADMIN_EMAILS = [
  "ryan@legacy-loop.com",
  "support@legacy-loop.com",
  "ryan@legacyloop.com",
  "ryanhallee@gmail.com",
];

export function isAdmin(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes(email ?? "");
}
