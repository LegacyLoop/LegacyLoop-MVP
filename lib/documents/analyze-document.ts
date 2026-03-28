/**
 * Multi-AI Document Analysis Engine
 *
 * Runs all 4 AI providers (OpenAI, Claude, Gemini, Grok) in parallel
 * to extract structured intelligence from uploaded documents.
 * Produces a consensus result with confidence scoring.
 *
 * Never throws — stores null on failure.
 */

import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DocumentExtraction {
  summary: string;
  documentType: string;
  dates: { label: string; value: string }[];
  prices: { label: string; value: number; currency: string }[];
  identifiers: { label: string; value: string }[]; // serial numbers, model numbers, etc.
  people: string[];                                  // names found
  organizations: string[];                           // companies, agencies, etc.
  authenticityMarkers: string[];                     // signatures, seals, stamps, watermarks
  conditionNotes: string[];                          // condition references
  provenanceDetails: string[];                       // ownership history, origin, chain of custody
  keyFindings: string[];                             // top 3-5 most important facts
  trustScore: number;                                // 0-10: how much this doc adds trust/value
  relevanceToItem: string;                           // how this doc relates to the item
}

export interface ProviderDocResult {
  provider: "openai" | "claude" | "gemini" | "grok";
  extraction: DocumentExtraction | null;
  raw: string;
  responseTime: number;
  error?: string;
}

export interface DocumentAnalysisResult {
  consensus: DocumentExtraction;
  providers: ProviderDocResult[];
  confidenceScore: number;     // 0-100
  agreementScore: number;      // 0-100
  successCount: number;
  failCount: number;
  analyzedAt: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function buildDocPrompt(docType: string, textContent?: string): string {
  const textBlock = textContent
    ? `\n\nDOCUMENT TEXT CONTENT (extracted):\n${textContent}`
    : "";

  return `You are an expert document analyst for a luxury resale and estate sale platform called LegacyLoop. You are analyzing a ${docType} document.

Your job: Extract EVERY piece of useful information from this document with precision.

Return a JSON object with these exact fields:

{
  "summary": "2-3 sentence plain-English summary of what this document is and its significance",
  "documentType": "What kind of document this actually is (may differ from user label)",
  "dates": [{"label": "Purchase date", "value": "2024-03-15"}, ...],
  "prices": [{"label": "Purchase price", "value": 1500, "currency": "USD"}, ...],
  "identifiers": [{"label": "Serial number", "value": "SN-12345"}, {"label": "Model", "value": "XYZ-100"}, ...],
  "people": ["John Smith", "Jane Doe"],
  "organizations": ["Sotheby's", "Certified Appraisers Inc."],
  "authenticityMarkers": ["Official letterhead", "Notarized signature", "Embossed seal", "Holographic sticker"],
  "conditionNotes": ["Described as 'excellent condition'", "Notes minor wear on base"],
  "provenanceDetails": ["Purchased at Christie's auction, lot #245", "Previously owned by estate of..."],
  "keyFindings": ["This receipt confirms purchase price of $1,500 on March 15, 2024", "Serial number matches item", ...],
  "trustScore": 8,
  "relevanceToItem": "This receipt establishes purchase price and date, confirming authenticity and ownership"
}

RULES:
- Extract EVERY date, price, name, number, and identifier visible
- For images: read ALL text in the image via OCR, including fine print, stamps, and handwriting
- For receipts: extract store name, date, line items, totals, payment method
- For certificates: extract issuing authority, certificate number, date, grade/rating, appraiser name
- For legal documents: extract parties, dates, property descriptions, terms
- For appraisals: extract appraised value, appraiser credentials, methodology, comparable items
- For manuals: extract model numbers, care instructions, warranty terms
- trustScore: 0 = no value, 5 = moderate, 10 = extremely valuable documentation
- If you can't read something, say so explicitly
- Return ONLY valid JSON. No markdown fences.${textBlock}`;
}

// ─── Provider Callers ──────────────────────────────────────────────────────

async function callOpenAI(
  prompt: string,
  imageBase64?: string,
  imageMime?: string
): Promise<{ data: DocumentExtraction | null; raw: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("No OPENAI_API_KEY");

  const messages: any[] = [
    {
      role: "user",
      content: imageBase64
        ? [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}`, detail: "high" } },
          ]
        : prompt,
    },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 2000 }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content?.trim() || "";
  return { data: parseExtraction(raw), raw };
}

async function callClaude(
  prompt: string,
  imageBase64?: string,
  imageMime?: string
): Promise<{ data: DocumentExtraction | null; raw: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No ANTHROPIC_API_KEY");

  const content: any[] = [];
  if (imageBase64) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: imageMime || "image/jpeg", data: imageBase64 },
    });
  }
  content.push({ type: "text", text: prompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Claude ${res.status}`);
    const json = await res.json();
    const raw = json.content?.[0]?.text?.trim() || "";
    return { data: parseExtraction(raw), raw };
  } finally {
    clearTimeout(timeout);
  }
}

async function callGemini(
  prompt: string,
  imageBase64?: string,
  imageMime?: string
): Promise<{ data: DocumentExtraction | null; raw: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No GEMINI_API_KEY");

  const parts: any[] = [];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: imageMime || "image/jpeg", data: imageBase64 } });
  }
  parts.push({ text: prompt });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: 2000 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  return { data: parseExtraction(raw), raw };
}

async function callGrok(
  prompt: string,
  imageBase64?: string,
  imageMime?: string
): Promise<{ data: DocumentExtraction | null; raw: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("No XAI_API_KEY");

  const model = imageBase64 ? "grok-2-vision-1212" : "grok-3-fast";
  const messages: any[] = [
    {
      role: "user",
      content: imageBase64
        ? [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` } },
          ]
        : prompt,
    },
  ];

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 2000 }),
  });

  if (!res.ok) throw new Error(`Grok ${res.status}`);
  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content?.trim() || "";
  return { data: parseExtraction(raw), raw };
}

// ─── JSON Parsing ──────────────────────────────────────────────────────────

function parseExtraction(raw: string): DocumentExtraction | null {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const obj = JSON.parse(match[0]);
    return {
      summary: String(obj.summary || ""),
      documentType: String(obj.documentType || ""),
      dates: Array.isArray(obj.dates) ? obj.dates : [],
      prices: Array.isArray(obj.prices) ? obj.prices : [],
      identifiers: Array.isArray(obj.identifiers) ? obj.identifiers : [],
      people: Array.isArray(obj.people) ? obj.people : [],
      organizations: Array.isArray(obj.organizations) ? obj.organizations : [],
      authenticityMarkers: Array.isArray(obj.authenticityMarkers) ? obj.authenticityMarkers : [],
      conditionNotes: Array.isArray(obj.conditionNotes) ? obj.conditionNotes : [],
      provenanceDetails: Array.isArray(obj.provenanceDetails) ? obj.provenanceDetails : [],
      keyFindings: Array.isArray(obj.keyFindings) ? obj.keyFindings : [],
      trustScore: typeof obj.trustScore === "number" ? obj.trustScore : 5,
      relevanceToItem: String(obj.relevanceToItem || ""),
    };
  } catch {
    return null;
  }
}

// ─── Consensus Builder ─────────────────────────────────────────────────────

function buildDocConsensus(results: ProviderDocResult[]): {
  consensus: DocumentExtraction;
  agreementScore: number;
  summary: string;
} {
  const valid = results.filter((r) => r.extraction);
  if (valid.length === 0) {
    return {
      consensus: emptyExtraction(),
      agreementScore: 0,
      summary: "No AI providers returned results.",
    };
  }

  // Merge: union arrays, average scores, longest strings
  const allDates = new Map<string, string>();
  const allPrices = new Map<string, { value: number; currency: string }>();
  const allIds = new Map<string, string>();
  const allPeople = new Set<string>();
  const allOrgs = new Set<string>();
  const allAuthMarkers = new Set<string>();
  const allCondNotes = new Set<string>();
  const allProvenance = new Set<string>();
  const allFindings = new Set<string>();
  let totalTrust = 0;

  for (const r of valid) {
    const e = r.extraction!;
    for (const d of e.dates) allDates.set(d.label, d.value);
    for (const p of e.prices) allPrices.set(p.label, { value: p.value, currency: p.currency });
    for (const id of e.identifiers) allIds.set(id.label, id.value);
    for (const p of e.people) allPeople.add(p);
    for (const o of e.organizations) allOrgs.add(o);
    for (const m of e.authenticityMarkers) allAuthMarkers.add(m);
    for (const c of e.conditionNotes) allCondNotes.add(c);
    for (const prov of e.provenanceDetails) allProvenance.add(prov);
    for (const f of e.keyFindings) allFindings.add(f);
    totalTrust += e.trustScore;
  }

  // Pick the longest summary and relevance
  const longestSummary = valid
    .map((r) => r.extraction!.summary)
    .sort((a, b) => b.length - a.length)[0] || "";
  const longestRelevance = valid
    .map((r) => r.extraction!.relevanceToItem)
    .sort((a, b) => b.length - a.length)[0] || "";
  const docType = valid[0]?.extraction?.documentType || "";

  const consensus: DocumentExtraction = {
    summary: longestSummary,
    documentType: docType,
    dates: Array.from(allDates.entries()).map(([label, value]) => ({ label, value })),
    prices: Array.from(allPrices.entries()).map(([label, { value, currency }]) => ({ label, value, currency })),
    identifiers: Array.from(allIds.entries()).map(([label, value]) => ({ label, value })),
    people: Array.from(allPeople).slice(0, 10),
    organizations: Array.from(allOrgs).slice(0, 10),
    authenticityMarkers: Array.from(allAuthMarkers).slice(0, 10),
    conditionNotes: Array.from(allCondNotes).slice(0, 10),
    provenanceDetails: Array.from(allProvenance).slice(0, 10),
    keyFindings: Array.from(allFindings).slice(0, 8),
    trustScore: Math.round(totalTrust / valid.length),
    relevanceToItem: longestRelevance,
  };

  // Agreement score: how many providers agree on key data
  let agreementPoints = 0;
  let totalPoints = 0;

  // Date agreement
  if (allDates.size > 0) {
    const dateAgreement = valid.filter((r) => (r.extraction?.dates?.length ?? 0) > 0).length / valid.length;
    agreementPoints += dateAgreement * 25;
    totalPoints += 25;
  }

  // Price agreement
  if (allPrices.size > 0) {
    const priceVals = valid
      .flatMap((r) => r.extraction?.prices || [])
      .map((p) => p.value)
      .filter((v) => v > 0);
    if (priceVals.length > 1) {
      const min = Math.min(...priceVals);
      const max = Math.max(...priceVals);
      const spread = max > 0 ? (max - min) / max : 0;
      agreementPoints += (1 - Math.min(spread, 1)) * 30;
    } else {
      agreementPoints += 30;
    }
    totalPoints += 30;
  }

  // Identifier agreement
  if (allIds.size > 0) {
    const idAgreement = valid.filter((r) => (r.extraction?.identifiers?.length ?? 0) > 0).length / valid.length;
    agreementPoints += idAgreement * 25;
    totalPoints += 25;
  }

  // Trust score agreement
  const trustScores = valid.map((r) => r.extraction!.trustScore);
  if (trustScores.length > 1) {
    const maxDev = Math.max(...trustScores) - Math.min(...trustScores);
    agreementPoints += maxDev <= 2 ? 20 : maxDev <= 4 ? 12 : 5;
  } else {
    agreementPoints += 20;
  }
  totalPoints += 20;

  const agreementScore = totalPoints > 0 ? Math.round((agreementPoints / totalPoints) * 100) : 0;

  const successProviders = valid.map((r) => r.provider).join(", ");
  const summaryText = `${valid.length} AI${valid.length > 1 ? "s" : ""} analyzed (${successProviders}). ${consensus.keyFindings.length} key findings extracted. Trust: ${consensus.trustScore}/10. Confidence: ${agreementScore}%.`;

  return { consensus, agreementScore, summary: summaryText };
}

function emptyExtraction(): DocumentExtraction {
  return {
    summary: "", documentType: "", dates: [], prices: [], identifiers: [],
    people: [], organizations: [], authenticityMarkers: [], conditionNotes: [],
    provenanceDetails: [], keyFindings: [], trustScore: 0, relevanceToItem: "",
  };
}

// ─── Main Analysis Function ────────────────────────────────────────────────

export async function analyzeDocument(
  documentId: string,
  fileUrl: string,
  fileType: string,
  docType: string
): Promise<void> {
  try {
    console.log(`[doc-analyze] Starting multi-AI analysis for ${documentId} (${docType}, ${fileType})`);

    // Prepare content for AI providers
    let imageBase64: string | undefined;
    let imageMime: string | undefined;
    let textContent: string | undefined;

    const absPath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));

    if (IMAGE_TYPES.has(fileType)) {
      const buffer = await fs.readFile(absPath);
      imageBase64 = buffer.toString("base64");
      const ext = fileUrl.split(".").pop()?.toLowerCase() || "jpeg";
      imageMime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    } else if (fileType === "text/plain" || fileType === "text/csv" || fileType === "text/rtf") {
      const raw = await fs.readFile(absPath, "utf-8");
      textContent = raw.slice(0, 5000);
    } else if (fileType === "application/pdf") {
      // Attempt text extraction from PDF bytes
      const buffer = await fs.readFile(absPath);
      const rawText = buffer
        .toString("utf-8")
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000);
      if (rawText.length >= 20) {
        textContent = rawText;
      } else {
        // Scanned PDF — send as image via base64 (first page visual)
        imageBase64 = buffer.toString("base64");
        imageMime = "application/pdf";
      }
    } else {
      // Word/Excel — store basic summary, skip multi-AI
      await prisma.itemDocument.update({
        where: { id: documentId },
        data: {
          aiSummary: `Document uploaded: ${docType} (${fileType}). Full AI extraction requires image or text format.`,
          confidenceScore: 0,
        },
      });
      return;
    }

    const prompt = buildDocPrompt(docType, textContent);

    // Run all 4 providers in parallel
    const providers: ProviderDocResult[] = [];
    const calls = [
      { provider: "openai" as const, fn: callOpenAI },
      { provider: "claude" as const, fn: callClaude },
      { provider: "gemini" as const, fn: callGemini },
      { provider: "grok" as const, fn: callGrok },
    ];

    const settled = await Promise.allSettled(
      calls.map(async ({ provider, fn }) => {
        const start = Date.now();
        try {
          const { data, raw } = await fn(prompt, imageBase64, imageMime);
          return { provider, extraction: data, raw, responseTime: Date.now() - start } as ProviderDocResult;
        } catch (err: any) {
          return {
            provider, extraction: null, raw: "",
            responseTime: Date.now() - start, error: err.message || "Failed",
          } as ProviderDocResult;
        }
      })
    );

    for (let i = 0; i < settled.length; i++) {
      const s = settled[i];
      if (s.status === "fulfilled") {
        providers.push(s.value);
      } else {
        providers.push({
          provider: calls[i].provider, extraction: null, raw: "",
          responseTime: 0, error: "Promise rejected",
        });
      }
    }

    const successCount = providers.filter((p) => p.extraction).length;
    const failCount = providers.filter((p) => p.error).length;

    console.log(`[doc-analyze] ${successCount}/${calls.length} providers succeeded for ${documentId}`);

    // Build consensus
    const { consensus, agreementScore, summary } = buildDocConsensus(providers);

    // Build plain-English AI summary from consensus
    const summaryParts = [consensus.summary];
    if (consensus.dates.length > 0) {
      summaryParts.push(`Dates: ${consensus.dates.map((d) => `${d.label}: ${d.value}`).join(", ")}.`);
    }
    if (consensus.prices.length > 0) {
      summaryParts.push(`Prices: ${consensus.prices.map((p) => `${p.label}: $${p.value}`).join(", ")}.`);
    }
    if (consensus.identifiers.length > 0) {
      summaryParts.push(`IDs: ${consensus.identifiers.map((id) => `${id.label}: ${id.value}`).join(", ")}.`);
    }
    if (consensus.authenticityMarkers.length > 0) {
      summaryParts.push(`Authenticity: ${consensus.authenticityMarkers.join(", ")}.`);
    }
    const aiSummary = summaryParts.join(" ").slice(0, 2000);

    // Store results
    const analysisResult: DocumentAnalysisResult = {
      consensus,
      providers: providers.map((p) => ({
        provider: p.provider,
        extraction: p.extraction,
        raw: p.raw?.slice(0, 500) || "", // Trim raw to save space
        responseTime: p.responseTime,
        error: p.error,
      })),
      confidenceScore: agreementScore,
      agreementScore,
      successCount,
      failCount,
      analyzedAt: new Date().toISOString(),
    };

    await prisma.itemDocument.update({
      where: { id: documentId },
      data: {
        aiSummary,
        aiAnalysis: JSON.stringify(analysisResult.consensus),
        confidenceScore: agreementScore,
        providerResults: JSON.stringify({
          providers: analysisResult.providers.map((p) => ({
            provider: p.provider,
            success: !!p.extraction,
            responseTime: p.responseTime,
            error: p.error || null,
            trustScore: p.extraction?.trustScore ?? null,
            findingsCount: p.extraction?.keyFindings?.length ?? 0,
          })),
          agreementScore,
          successCount,
          failCount,
          analyzedAt: analysisResult.analyzedAt,
        }),
      },
    });

    // Also create an EventLog for enrichment pipeline
    await prisma.eventLog.create({
      data: {
        itemId: (await prisma.itemDocument.findUnique({ where: { id: documentId }, select: { itemId: true } }))?.itemId || "",
        eventType: "DOCUMENT_ANALYZED",
        payload: JSON.stringify({
          documentId,
          docType,
          confidenceScore: agreementScore,
          trustScore: consensus.trustScore,
          keyFindings: consensus.keyFindings,
          successCount,
          summary: aiSummary.slice(0, 500),
        }),
      },
    });

    console.log(`[doc-analyze] Complete for ${documentId}: ${successCount} providers, confidence=${agreementScore}%, trust=${consensus.trustScore}/10`);
  } catch (err: any) {
    console.error(`[doc-analyze] Failed for ${documentId}:`, err.message || err);
  }
}
