// app/api/sylvia/tools/openapi/route.ts
//
// CMD-SYLVIA-OPENAPI-SERVE V20 R29 P64-rider · 2026-05-15 PM
//
// GET /api/sylvia/tools/openapi — serves the canonical OpenAPI 3.1 spec
// for Sylvia operational tools (file_read · file_write · forward bash).
//
// Open WebUI Tool Server registration consumes this URL via Admin →
// Settings → Integrations → Manage Tool Servers → Add Connection.
//
// No auth required (spec is public surface · Bearer auth gates per-call).

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

const SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Sylvia Operational Tools",
    version: "1.1.0",
    description:
      "HTTP-route operational tools for Sylvia AI agent (file_read + file_write)",
  },
  servers: [
    { url: "https://app.legacy-loop.com", description: "Production Vercel" },
    {
      url: "http://host.docker.internal:3000",
      description: "Local Next.js dev (Open WebUI Docker → host)",
    },
  ],
  paths: {
    "/api/sylvia/tools/file-read": {
      post: {
        operationId: "file_read",
        summary: "Read a file from the local filesystem (permission-gated)",
        description:
          "Read a file content with credential-redaction and audit logging. Permission gate: ENV allow-list + hard deny for .env*, secrets/, .git/, etc. Default-deny if no allow-list match. Max 512 KB per call.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["path"],
                properties: {
                  path: { type: "string", description: "Absolute or relative path" },
                  encoding: {
                    type: "string",
                    enum: ["utf-8", "base64"],
                    default: "utf-8",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "File read successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    content: { type: "string" },
                    bytesRead: { type: "integer" },
                    credentialsRedacted: { type: "integer" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Auth failure" },
          "403": { description: "Permission denied" },
          "500": { description: "Internal error" },
        },
      },
    },
    "/api/sylvia/tools/file-write": {
      post: {
        operationId: "file_write",
        summary:
          "Write a file to the local filesystem (permission-gated · create-only default)",
        description:
          "Write file content with permission gate + audit logging + SHA256 chain-of-custody. Default mode: create-only (refuses overwrite). Max 512 KB per call. Input credential-detect counts + WARN log (NEVER blocks v1).",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["path", "content"],
                properties: {
                  path: { type: "string", description: "Absolute or relative path" },
                  content: { type: "string", description: "File content (utf-8 or base64)" },
                  mode: {
                    type: "string",
                    enum: ["create-only", "append", "overwrite"],
                    default: "create-only",
                    description:
                      "create-only refuses overwrite · append adds to end · overwrite replaces",
                  },
                  encoding: {
                    type: "string",
                    enum: ["utf-8", "base64"],
                    default: "utf-8",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "File write successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    outcome: { type: "string" },
                    bytesWritten: { type: "integer" },
                    preExistedAtPath: { type: "boolean" },
                    contentHash: {
                      type: "string",
                      description: "SHA256 16-char prefix",
                    },
                    credentialsDetectedInInput: { type: "integer" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Auth failure" },
          "403": { description: "Permission denied" },
          "409": { description: "File exists · create-only mode" },
          "500": { description: "Internal error" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "SYLVIA_API_INTERNAL_SECRET",
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(SPEC, {
    headers: { "Cache-Control": "no-store" },
  });
}
