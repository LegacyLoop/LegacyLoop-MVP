// fb-army · World-B · residential-proxy egress config
// ALL proxy credentials read from DROPLET env at runtime · NEVER repo · NEVER Vercel
// BINDING #9 ABSOLUTE · ZERO creds committed

export type ProxyConfig = {
  server: string;        // e.g. "http://gw.smartproxy.com:7000"
  username?: string;     // residential proxy username (droplet env)
  password?: string;     // residential proxy password (droplet env)
};

export function loadProxyConfig(): ProxyConfig | null {
  const url = process.env.FB_ARMY_PROXY_URL;
  if (!url) return null; // graceful: no proxy = direct egress (test mode only)
  const username = process.env.FB_ARMY_PROXY_USER;
  const password = process.env.FB_ARMY_PROXY_PASS;
  return {
    server: url,
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  };
}

// Burner FB session cookies (droplet env only · never committed)
export type BurnerSession = {
  accountId: string;     // arbitrary tag like "burner-001"
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
  }>;
};

export function loadBurnerSession(): BurnerSession | null {
  const raw = process.env.FB_ARMY_BURNER_COOKIES_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BurnerSession;
    if (!parsed.accountId || !Array.isArray(parsed.cookies)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Egress sanity · BINDING #9 attestation runtime
export function assertEgressSafety(): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  // NEVER reach for any World-A or Meta-dev-account env var
  const FORBIDDEN_KEYS = [
    "META_APP_SECRET",
    "FB_APP_SECRET",
    "FACEBOOK_GRAPH_TOKEN",
    "META_DEV_ACCESS_TOKEN",
  ];
  for (const k of FORBIDDEN_KEYS) {
    if (process.env[k]) {
      reasons.push(`World-A env present (${k}) · refuse to run · isolation breach risk`);
    }
  }
  return { ok: reasons.length === 0, reasons };
}
