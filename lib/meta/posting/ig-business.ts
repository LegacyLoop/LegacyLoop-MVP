// CMD-W26-C · Instagram Business posting service (Peg §5.6).
//
// Instagram publishing is always 2-step: (1) create a media container, then
// (2) publish that container. Supports single image, carousel (2–10 children),
// and stories. All calls use an IG-linked Page access token (caller-supplied).
// World-A only (Rule #11). NOT an AI call — BINDING #10 not applicable.
// Reference: https://developers.facebook.com/docs/instagram-platform/content-publishing

import { classifyMetaError, type MetaErrorAction } from "@/lib/meta/messenger/error-codes";

const GRAPH_BASE = process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com/v21.0";

export interface IgResult {
  ok: boolean;
  status: number;
  id?: string; // container id (step 1) or media id (step 2)
  errorMessage?: string;
  errorAction?: MetaErrorAction;
}

interface IgAuth {
  igUserId: string; // IG Business account id
  accessToken: string;
}

async function igPost(path: string, params: Record<string, string>): Promise<IgResult> {
  const url = `${GRAPH_BASE}/${path}`;
  const form = new URLSearchParams(params);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      error?: { message?: string; code?: number; error_subcode?: number };
    };
    if (!res.ok || !json.id) {
      const code = json.error?.code;
      return {
        ok: false,
        status: res.status,
        errorMessage: json.error?.message ?? `HTTP ${res.status}`,
        errorAction:
          typeof code === "number"
            ? classifyMetaError(code, json.error?.error_subcode ?? null).action
            : undefined,
      };
    }
    return { ok: true, status: res.status, id: json.id };
  } catch (e: unknown) {
    clearTimeout(timeout);
    return { ok: false, status: 0, errorMessage: e instanceof Error ? e.message : String(e) };
  }
}

/** Step 2 — publish a previously-created container. */
export function publishContainer(auth: IgAuth, creationId: string): Promise<IgResult> {
  return igPost(`${auth.igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: auth.accessToken,
  });
}

/** Single image — create container then publish. Optional caption. */
export async function publishImage(
  auth: IgAuth,
  imageUrl: string,
  caption?: string,
): Promise<IgResult> {
  const params: Record<string, string> = { image_url: imageUrl, access_token: auth.accessToken };
  if (caption) params.caption = caption;
  const container = await igPost(`${auth.igUserId}/media`, params);
  if (!container.ok || !container.id) return container;
  return publishContainer(auth, container.id);
}

/**
 * Carousel — create a child container per image (is_carousel_item=true), then a
 * parent CAROUSEL container referencing the children, then publish. 2–10 items.
 */
export async function publishCarousel(
  auth: IgAuth,
  imageUrls: string[],
  caption?: string,
): Promise<IgResult> {
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    return { ok: false, status: 0, errorMessage: "carousel requires 2–10 images" };
  }
  const childIds: string[] = [];
  for (const url of imageUrls) {
    const child = await igPost(`${auth.igUserId}/media`, {
      image_url: url,
      is_carousel_item: "true",
      access_token: auth.accessToken,
    });
    if (!child.ok || !child.id) return child;
    childIds.push(child.id);
  }
  const parentParams: Record<string, string> = {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    access_token: auth.accessToken,
  };
  if (caption) parentParams.caption = caption;
  const parent = await igPost(`${auth.igUserId}/media`, parentParams);
  if (!parent.ok || !parent.id) return parent;
  return publishContainer(auth, parent.id);
}

/** Story — image story container (media_type=STORIES) then publish. */
export async function publishStory(auth: IgAuth, imageUrl: string): Promise<IgResult> {
  const container = await igPost(`${auth.igUserId}/media`, {
    image_url: imageUrl,
    media_type: "STORIES",
    access_token: auth.accessToken,
  });
  if (!container.ok || !container.id) return container;
  return publishContainer(auth, container.id);
}
