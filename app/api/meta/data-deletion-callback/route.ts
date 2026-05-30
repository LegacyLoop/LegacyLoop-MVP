// CMD-W26-D · Meta data deletion request callback.
// Meta POSTs application/x-www-form-urlencoded with a `signed_request` field when
// a user removes the app. We verify the signature, run the deletion job, and
// return { url, confirmation_code } per Meta's contract. Invalid signature → 403.
// Reference: https://developers.facebook.com/docs/development/data-deletion-request-callback

import { NextRequest, NextResponse } from "next/server";
import { verifySignedRequest } from "@/lib/meta/signed-request/verify";
import { runMetaDataDeletion } from "@/lib/meta/data-deletion/job";

export async function POST(req: NextRequest) {
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET;
  if (!appSecret) {
    console.error("[meta-deletion-callback] No META_APP_SECRET / FACEBOOK_CLIENT_SECRET configured");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  // Meta sends form-encoded signed_request; tolerate JSON too.
  let signedRequest: string | null = null;
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { signed_request?: string };
      signedRequest = body.signed_request ?? null;
    } else {
      const form = await req.formData();
      const v = form.get("signed_request");
      signedRequest = typeof v === "string" ? v : null;
    }
  } catch {
    signedRequest = null;
  }

  const payload = verifySignedRequest(signedRequest, appSecret);
  if (!payload) {
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 403 });
  }

  const result = await runMetaDataDeletion(payload.user_id);

  const origin = req.nextUrl.origin;
  const code = result.confirmationCode;
  return NextResponse.json({
    url: `${origin}/data-deletion-status?code=${encodeURIComponent(code)}`,
    confirmation_code: code,
  });
}
