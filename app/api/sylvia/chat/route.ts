// app/api/sylvia/chat/route.ts
//
// CMD-SYLVIA-HARDWIRED-CHAT-V1 V20 v2.1 R29 P70 · Wave 14 Slot C · 2026-05-16
//
// POST /api/sylvia/chat — native hardwired Sylvia chat handler.
// Returns text/event-stream SSE response · streaming · tool-dispatch inline.
//
// Auth: custom JWT via lib/adapters/auth.ts authAdapter.getSession()
//       + tier check via SYLVIA_CHAT_ALLOWED_USER_IDS env (CEO + family only)

import { NextResponse, type NextRequest } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { handleSylviaChatStream } from "@/lib/sylvia/chat/handler";
import type { SylviaChatRequest, ChatHandlerContext } from "@/lib/sylvia/chat/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function errorEnvelope(status: number, message: string, code?: string) {
  return NextResponse.json(
    code ? { error: message, code } : { error: message },
    { status },
  );
}

function userIdAllowed(userId: string): boolean {
  const raw = process.env.SYLVIA_CHAT_ALLOWED_USER_IDS ?? "";
  if (!raw.trim()) return false; // default-deny if env not set
  const list = raw.split(";").map(s => s.trim()).filter(Boolean);
  return list.includes(userId);
}

export async function POST(req: NextRequest) {
  // Auth gate · custom JWT
  const session = await authAdapter.getSession();
  if (!session) {
    return errorEnvelope(401, "Authentication required", "AUTH");
  }
  if (!userIdAllowed(session.id)) {
    return errorEnvelope(403, "Not authorized for Sylvia chat", "FORBIDDEN");
  }

  // Parse body
  let body: SylviaChatRequest;
  try {
    body = (await req.json()) as SylviaChatRequest;
  } catch {
    return errorEnvelope(400, "Invalid JSON body", "VALIDATION");
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return errorEnvelope(400, "messages required (non-empty array)", "VALIDATION");
  }

  const ctx: ChatHandlerContext = {
    caller: session.id,
    callerEmail: session.email,
    sessionId: body.sessionId ?? `sylvia-chat-${crypto.randomUUID()}`,
    startedAt: Date.now(),
  };

  // SSE stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of handleSylviaChatStream(body.messages, ctx)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: msg, code: "STREAM" })}\n\n`,
          ),
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", finishReason: "error" })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
