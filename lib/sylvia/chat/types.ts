// lib/sylvia/chat/types.ts
//
// CMD-SYLVIA-HARDWIRED-CHAT-V1 V20 v2.1 R29 P70 · Wave 14 Slot C · 2026-05-16
//
// Type contracts for native hardwired Sylvia chat handler.
// Shape mirrors OpenAI-compat (LiteLLM Gateway egress) for forward
// compat with tool-call ingestion. Forward-compat: P65 bash tool +
// B2-W4 voice + B2-W5 WebFetch slot into same SylviaChatMessage shape.

export type SylviaChatRole = "system" | "user" | "assistant" | "tool";

export interface SylviaToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON-encoded · LiteLLM-passthrough shape
  };
}

export interface SylviaChatMessage {
  role: SylviaChatRole;
  content: string;
  // assistant turn may carry tool_calls (function_call invocations)
  tool_calls?: SylviaToolCall[];
  // tool role carries tool_call_id (matches assistant's tool_calls[i].id)
  tool_call_id?: string;
  name?: string; // tool name when role=tool
}

export interface SylviaChatRequest {
  messages: SylviaChatMessage[]; // history (NOT including new user turn) + new user turn at last index
  sessionId?: string;
}

export interface ChatHandlerContext {
  caller: string;        // user.id from JWT session
  callerEmail?: string;
  sessionId: string;
  startedAt: number;
}

// SSE stream chunk emitted from handler → client
export type SylviaChatStreamChunk =
  | { type: "delta"; content: string }
  | { type: "tool_call_start"; name: string; toolCallId: string }
  | { type: "tool_call_result"; toolCallId: string; outcome: string; summary?: string }
  | { type: "done"; finishReason: "stop" | "length" | "tool_error" | "error"; totalTokens?: number; totalCostUsd?: number }
  | { type: "error"; message: string; code?: string };

export interface ToolCallDelta {
  index: number;
  id?: string;
  type?: "function";
  function?: { name?: string; arguments?: string };
}
