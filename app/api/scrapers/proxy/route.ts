import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type {
  ProxyRequest,
  ProxyResponse,
  ProviderName,
} from "@/lib/scrapers/proxy/types";
import {
  getAdapter,
  listEnabledAdapters,
} from "@/lib/scrapers/proxy/registry";
import { validateProxyAuth } from "@/lib/scrapers/proxy/auth";
import { recordProxyCall } from "@/lib/scrapers/proxy/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    enabled_adapters: listEnabledAdapters(),
    docs: 'POST { provider, operation, params } with X-Scraper-Proxy-Token header',
  });
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ProxyResponse>> {
  const startedAt = Date.now();
  const requestId = randomUUID();

  if (!validateProxyAuth(req.headers.get("x-scraper-proxy-token"))) {
    return NextResponse.json(
      {
        ok: false,
        provider: "unknown" as ProviderName | "unknown",
        operation: "unauthorized",
        error: {
          code: "UNAUTHORIZED",
          message: "invalid or missing X-Scraper-Proxy-Token",
        },
        meta: {
          request_id: requestId,
          latency_ms: Date.now() - startedAt,
        },
      } as ProxyResponse,
      { status: 401 },
    );
  }

  let body: ProxyRequest;
  try {
    body = (await req.json()) as ProxyRequest;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        provider: "unknown" as ProviderName | "unknown",
        operation: "bad_request",
        error: { code: "BAD_REQUEST", message: "invalid JSON body" },
        meta: {
          request_id: requestId,
          latency_ms: Date.now() - startedAt,
        },
      } as ProxyResponse,
      { status: 400 },
    );
  }

  const adapter = getAdapter(body.provider);
  if (!adapter) {
    return NextResponse.json(
      {
        ok: false,
        provider: body.provider,
        operation: body.operation,
        error: {
          code: "UNKNOWN_PROVIDER",
          message: `provider ${body.provider} not registered`,
        },
        meta: {
          request_id: requestId,
          latency_ms: Date.now() - startedAt,
        },
      },
      { status: 400 },
    );
  }

  if (!adapter.enabled) {
    return NextResponse.json(
      {
        ok: false,
        provider: body.provider,
        operation: body.operation,
        error: {
          code: "PROVIDER_DISABLED",
          message: `provider ${body.provider} env keys absent`,
        },
        meta: {
          request_id: requestId,
          latency_ms: Date.now() - startedAt,
        },
      },
      { status: 503 },
    );
  }

  try {
    const data = await adapter.call(body.operation, body.params ?? {});
    const latency_ms = Date.now() - startedAt;
    void recordProxyCall({
      provider: body.provider,
      operation: body.operation,
      request_id: requestId,
      ok: true,
      latency_ms,
    });
    return NextResponse.json({
      ok: true,
      provider: body.provider,
      operation: body.operation,
      data,
      meta: { request_id: requestId, latency_ms },
    });
  } catch (err) {
    const latency_ms = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : "adapter error";
    void recordProxyCall({
      provider: body.provider,
      operation: body.operation,
      request_id: requestId,
      ok: false,
      latency_ms,
      error_code: "ADAPTER_ERROR",
    });
    return NextResponse.json(
      {
        ok: false,
        provider: body.provider,
        operation: body.operation,
        error: { code: "ADAPTER_ERROR", message },
        meta: { request_id: requestId, latency_ms },
      },
      { status: 502 },
    );
  }
}
