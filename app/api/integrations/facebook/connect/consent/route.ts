// CMD-W26-B · Business-app consent entry point.
// GET /api/integrations/facebook/connect/consent
//   → 302 to Meta OAuth dialog with 10 Phase-1 scopes + CSRF state.
//
// LOGGED-IN USERS ONLY. Distinct from app/api/auth/facebook/* (Login app).

import { authAdapter } from "@/lib/adapters/auth";
import { buildPageConsentUrl, PageConsentError } from "@/lib/meta/oauth/page-consent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") || undefined;

  try {
    const { url: consentUrl } = buildPageConsentUrl({ userId: user.id, returnTo });
    return Response.redirect(consentUrl, 302);
  } catch (e: unknown) {
    if (e instanceof PageConsentError) {
      return new Response(`consent unconfigured: ${e.message}`, { status: 503 });
    }
    return new Response("consent error", { status: 500 });
  }
}
