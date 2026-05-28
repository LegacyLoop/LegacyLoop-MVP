import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["mint_token", "subreddit_top"] as const;

let cachedToken: { token: string; expires_at: number } | null = null;

async function mintRedditToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const id = process.env.REDDIT_CLIENT_ID!;
  const secret = process.env.REDDIT_CLIENT_SECRET!;
  const ua = process.env.REDDIT_USER_AGENT || "legacyloop/1.0";
  const auth = `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
  const r = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": ua,
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`reddit oauth ${r.status}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: j.access_token,
    expires_at: Date.now() + j.expires_in * 1000,
  };
  return j.access_token;
}

export const redditOauthAdapter: Adapter = {
  provider: "reddit-oauth",
  enabled: envPresent("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"),
  operations: OPERATIONS,
  async call(operation, params) {
    const ua = process.env.REDDIT_USER_AGENT || "legacyloop/1.0";
    if (operation === "mint_token") {
      const token = await mintRedditToken();
      return { ok: true, token_minted: token.slice(0, 8) + "…" };
    }
    if (operation === "subreddit_top") {
      const token = await mintRedditToken();
      const subreddit = String(params.subreddit ?? "");
      const limit = Number(params.limit ?? 25);
      const t = String(params.t ?? "day");
      const r = await fetch(
        `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/top?limit=${limit}&t=${t}`,
        {
          headers: { Authorization: `Bearer ${token}`, "User-Agent": ua },
        },
      );
      if (!r.ok) throw new Error(`reddit ${r.status}`);
      return await r.json();
    }
    throw new Error(`reddit-oauth: unknown operation ${operation}`);
  },
};
