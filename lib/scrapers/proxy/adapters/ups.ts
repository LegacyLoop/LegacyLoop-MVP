import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["oauth_token", "get_rates"] as const;

let cachedToken: { token: string; expires_at: number } | null = null;

async function mintUpsToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const id = process.env.UPS_CLIENT_ID!;
  const secret = process.env.UPS_CLIENT_SECRET!;
  const auth = `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
  const r = await fetch(
    "https://onlinetools.ups.com/security/v1/oauth/token",
    {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
  );
  if (!r.ok) throw new Error(`ups oauth ${r.status}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: j.access_token,
    expires_at: Date.now() + j.expires_in * 1000,
  };
  return j.access_token;
}

export const upsAdapter: Adapter = {
  provider: "ups",
  enabled: envPresent("UPS_CLIENT_ID", "UPS_CLIENT_SECRET"),
  operations: OPERATIONS,
  async call(operation, params) {
    if (operation === "oauth_token") {
      const token = await mintUpsToken();
      return { ok: true, token_minted: token.slice(0, 8) + "…" };
    }
    if (operation === "get_rates") {
      const token = await mintUpsToken();
      const r = await fetch("https://onlinetools.ups.com/api/rating/v1/Rate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      if (!r.ok) throw new Error(`ups rates ${r.status}`);
      return await r.json();
    }
    throw new Error(`ups: unknown operation ${operation}`);
  },
};
