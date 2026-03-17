/**
 * AI Document Summarizer
 *
 * Extracts intelligence from uploaded documents using OpenAI.
 * Stores summary in ItemDocument.aiSummary.
 * Never throws — aiSummary stays null on failure.
 */

import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

const SUMMARY_PROMPT =
  "You are analyzing a document image for a resale platform. Extract all useful information: dates, prices, model numbers, serial numbers, condition notes, authenticity markers, provenance details. Be concise and structured. Output as plain text summary.";

const TEXT_SUMMARY_PROMPT =
  "You are analyzing a document for a resale platform. Extract all useful information: dates, prices, model numbers, serial numbers, condition notes, authenticity markers, provenance details, warranty info. Be concise and structured. Output as plain text summary.";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function summarizeDocument(
  documentId: string,
  fileUrl: string,
  fileType: string,
  docType: string
): Promise<void> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log("[doc-summarize] No OPENAI_API_KEY — skipping");
      return;
    }

    let summary: string | null = null;

    if (IMAGE_TYPES.has(fileType)) {
      // Image document — use vision
      summary = await summarizeImage(apiKey, fileUrl, docType);
    } else if (fileType === "text/plain" || fileType === "text/csv" || fileType === "text/rtf") {
      // Text-based — read content directly
      summary = await summarizeText(apiKey, fileUrl, docType);
    } else if (fileType === "application/pdf") {
      // PDF — attempt text extraction from first bytes
      summary = await summarizePdf(apiKey, fileUrl, docType);
    } else {
      // Word/Excel/other — basic metadata summary
      summary = `Document uploaded: ${docType} (${fileType}). AI extraction not available for this format — manual review recommended.`;
    }

    if (summary) {
      await prisma.itemDocument.update({
        where: { id: documentId },
        data: { aiSummary: summary },
      });
      console.log(`[doc-summarize] Stored summary for document ${documentId} (${summary.length} chars)`);
    }
  } catch (err: any) {
    console.error("[doc-summarize] Failed:", err.message || err);
  }
}

async function summarizeImage(
  apiKey: string,
  fileUrl: string,
  docType: string
): Promise<string | null> {
  // Read file and convert to base64
  const absPath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  const buffer = await fs.readFile(absPath);
  const base64 = buffer.toString("base64");
  const ext = fileUrl.split(".").pop()?.toLowerCase() || "jpeg";
  const mediaType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${SUMMARY_PROMPT}\n\nDocument type: ${docType}` },
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[doc-summarize] OpenAI vision error ${res.status}: ${text.slice(0, 200)}`);
    return null;
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || null;
}

async function summarizeText(
  apiKey: string,
  fileUrl: string,
  docType: string
): Promise<string | null> {
  const absPath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  const raw = await fs.readFile(absPath, "utf-8");
  const content = raw.slice(0, 3000);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `${TEXT_SUMMARY_PROMPT}\n\nDocument type: ${docType}\n\nDocument content:\n${content}`,
        },
      ],
      max_tokens: 500,
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || null;
}

async function summarizePdf(
  apiKey: string,
  fileUrl: string,
  docType: string
): Promise<string | null> {
  // Read raw PDF bytes and attempt to extract visible text
  const absPath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  const buffer = await fs.readFile(absPath);
  const rawText = buffer
    .toString("utf-8")
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  if (rawText.length < 20) {
    // Not enough extractable text — treat as image (first page)
    return `PDF document uploaded: ${docType}. Text extraction yielded insufficient content — visual review recommended.`;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `${TEXT_SUMMARY_PROMPT}\n\nDocument type: ${docType}\n\nExtracted PDF text:\n${rawText}`,
        },
      ],
      max_tokens: 500,
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || null;
}
