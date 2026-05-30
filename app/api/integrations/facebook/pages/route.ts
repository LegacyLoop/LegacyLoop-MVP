import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { listPages, getPageInsights } from "@/lib/meta/graph";

/**
 * GET /api/integrations/facebook/pages
 *   → lists the connected user's FB Pages via Graph (tokens stripped).
 * GET /api/integrations/facebook/pages?insights=<pageId>
 *   → returns engagement insights for one stored Page.
 *
 * Reads the long-lived user token (and per-page tokens) previously persisted to
 * ConnectedPlatform.settingsJson by the connect flow. Page access tokens are
 * NEVER returned to the client.
 */

interface StoredPage {
  id: string;
  name: string;
  accessToken: string;
  category: string | null;
}

interface FacebookSettings {
  userToken?: string;
  pages?: StoredPage[];
}

function parseSettings(raw: string | null | undefined): FacebookSettings {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as FacebookSettings;
  } catch {
    /* corrupt settings — treat as empty */
  }
  return {};
}

export async function GET(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const connection = await prisma.connectedPlatform.findUnique({
    where: { userId_platform: { userId: user.id, platform: "facebook" } },
    select: { settingsJson: true, isActive: true },
  });

  if (!connection || !connection.isActive) {
    return Response.json({ ok: false, error: "facebook not connected" }, { status: 404 });
  }

  const settings = parseSettings(connection.settingsJson);
  const insightsPageId = req.nextUrl.searchParams.get("insights");

  // ── Insights for a single stored Page ──
  if (insightsPageId) {
    const page = settings.pages?.find((p) => p.id === insightsPageId);
    if (!page?.accessToken) {
      return Response.json({ ok: false, error: "page token not stored" }, { status: 404 });
    }
    const result = await getPageInsights(page.id, page.accessToken);
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error.message }, { status: 502 });
    }
    return Response.json({ ok: true, pageId: page.id, insights: result.data });
  }

  // ── Live Pages list (refreshes from Graph if a user token is stored) ──
  if (settings.userToken) {
    const result = await listPages(settings.userToken);
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error.message }, { status: 502 });
    }
    // Strip access tokens before returning to the client.
    const pages = result.data.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      tasks: p.tasks,
    }));
    return Response.json({ ok: true, pages });
  }

  // ── No user token: return whatever Pages are cached in settings (tokens stripped) ──
  const cached = (settings.pages ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
  }));
  return Response.json({ ok: true, pages: cached, cached: true });
}
