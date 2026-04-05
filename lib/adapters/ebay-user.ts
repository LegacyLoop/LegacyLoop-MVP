import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════════════════
   eBay Per-User Token Manager

   Manages user-level OAuth tokens (for selling/listing on their behalf).
   Automatically refreshes expired tokens using the refresh_token.

   This is SEPARATE from the app-level token in ebay.ts (Browse API).
   App-level = search comps. User-level = list items on their account.
   ═══════════════════════════════════════════════════════════════════════ */

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID || "";
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET || "";

interface EbayTokenSettings {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  refresh_token_expires_at: number | null;
}

/**
 * Get a valid eBay user access token for the given userId.
 * Returns null if user isn't connected or tokens are fully expired.
 * Auto-refreshes if the access_token is expired but refresh_token is still valid.
 */
export async function getEbayUserToken(userId: string): Promise<string | null> {
  const connection = await prisma.connectedPlatform.findUnique({
    where: { userId_platform: { userId, platform: "ebay" } },
  });

  if (!connection || !connection.isActive) return null;

  let settings: EbayTokenSettings;
  try {
    settings = JSON.parse(connection.settingsJson);
  } catch {
    return null;
  }

  if (!settings.access_token || !settings.refresh_token) return null;

  // ── Check if access token is still valid (5 min buffer) ──
  if (Date.now() < settings.expires_at - 300_000) {
    return settings.access_token;
  }

  // ── Check if refresh token is expired ──
  if (settings.refresh_token_expires_at && Date.now() > settings.refresh_token_expires_at) {
    // Refresh token is dead — user needs to re-authenticate
    await prisma.connectedPlatform.update({
      where: { userId_platform: { userId, platform: "ebay" } },
      data: { isActive: false },
    });
    return null;
  }

  // ── Refresh the access token ──
  try {
    const basic = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString("base64");

    const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: settings.refresh_token,
      }),
    });

    if (!res.ok) {
      console.error("[eBay User Token] Refresh failed:", res.status);
      // Mark as inactive so user knows to reconnect
      await prisma.connectedPlatform.update({
        where: { userId_platform: { userId, platform: "ebay" } },
        data: { isActive: false },
      });
      return null;
    }

    const tokenData = await res.json();

    // Update stored tokens
    const newSettings: EbayTokenSettings = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || settings.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      refresh_token_expires_at: settings.refresh_token_expires_at,
    };

    await prisma.connectedPlatform.update({
      where: { userId_platform: { userId, platform: "ebay" } },
      data: {
        lastSync: new Date(),
        settingsJson: JSON.stringify(newSettings),
      },
    });

    return tokenData.access_token;
  } catch (err: any) {
    console.error("[eBay User Token] Refresh error:", err.message);
    return null;
  }
}

/**
 * Check if a user has an active eBay connection.
 */
export async function isEbayConnected(userId: string): Promise<boolean> {
  const connection = await prisma.connectedPlatform.findUnique({
    where: { userId_platform: { userId, platform: "ebay" } },
    select: { isActive: true },
  });
  return connection?.isActive ?? false;
}
