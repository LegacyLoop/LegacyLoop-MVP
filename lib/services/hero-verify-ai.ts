/**
 * Hero Verification — AI Document Analysis
 *
 * Uses OpenAI Vision (gpt-4o) to analyze uploaded proof documents
 * (DD-214, military IDs, badges, department IDs, certifications).
 * Returns a structured confidence assessment for admin review.
 */

import { readFile } from "fs/promises";
import path from "path";

interface AiVerificationResult {
  isLikelyValid: boolean;
  confidence: number; // 0-100
  documentType: string; // e.g. "DD-214", "Military ID", "Badge Photo", "Department ID"
  matchesCategory: boolean; // Does the doc match the claimed service category?
  detectedCategory: string | null; // MILITARY | LAW_ENFORCEMENT | FIRE_EMS | UNKNOWN
  nameFound: string | null; // Name detected on the document (if any)
  nameMatchScore: number; // 0-100: how well it matches the applicant's name
  flags: string[]; // Red flags or concerns
  summary: string; // Short human-readable summary for admin
  rawAnalysis: string; // Full AI response text
}

const VERIFICATION_PROMPT = `You are a document verification specialist for a hero discount program. Analyze this uploaded document and determine if it is a valid proof of service for military, law enforcement, or fire/EMS.

APPLICANT CLAIMS:
- Name: {APPLICANT_NAME}
- Service Category: {SERVICE_CATEGORY}
- Role: {SERVICE_DETAIL}
- Department: {DEPARTMENT}

ANALYZE THE DOCUMENT AND RESPOND IN THIS EXACT JSON FORMAT:
{
  "isLikelyValid": true/false,
  "confidence": 0-100,
  "documentType": "string describing what this document appears to be",
  "matchesCategory": true/false,
  "detectedCategory": "MILITARY" | "LAW_ENFORCEMENT" | "FIRE_EMS" | "UNKNOWN",
  "nameFound": "name visible on document or null",
  "nameMatchScore": 0-100,
  "flags": ["array of concerns or red flags, empty if none"],
  "summary": "1-2 sentence summary for the admin reviewer"
}

RULES:
- Be thorough but fair. Real documents come in many formats.
- DD-214 forms, VA ID cards, military IDs are valid for MILITARY.
- Badge photos, department IDs, police IDs are valid for LAW_ENFORCEMENT.
- Department IDs, EMT certifications, fire dept IDs are valid for FIRE_EMS.
- Flag if: document appears edited/photoshopped, text is blurry/unreadable, name doesn't match, document is expired (note but don't auto-reject), document is clearly unrelated (e.g. driver's license).
- Do NOT reject for minor formatting differences — real documents vary widely.
- Confidence 80+ means you're fairly certain it's valid.
- Confidence 50-79 means plausible but needs human review.
- Confidence below 50 means significant concerns.
- Return ONLY the JSON object, no other text.`;

export async function analyzeHeroDocument(
  proofFilePath: string,
  applicantName: string,
  serviceCategory: string,
  serviceDetail: string,
  department: string | null
): Promise<AiVerificationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackResult("OpenAI API key not configured");
  }

  // Read the file and convert to base64
  let base64Data: string;
  let mimeType: string;

  try {
    // CMD-CLOUDINARY-PHOTO-READ-FIX: read from URL or local disk
    const { readPhotoAsBuffer, guessMimeType: gmt } = await import("@/lib/adapters/storage");
    const buffer = await readPhotoAsBuffer(proofFilePath);
    base64Data = buffer.toString("base64");

    const ext = proofFilePath.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      pdf: "application/pdf",
      heic: "image/heic",
      heif: "image/heif",
    };
    mimeType = mimeMap[ext] || "image/jpeg";
  } catch (err) {
    console.error("[HeroAI] Failed to read proof file:", err);
    return fallbackResult("Failed to read uploaded document");
  }

  // PDF files can't be sent as images — provide a text-only analysis
  if (mimeType === "application/pdf") {
    return fallbackResult("PDF documents require manual review (AI Vision only supports images)");
  }

  const prompt = VERIFICATION_PROMPT
    .replace("{APPLICANT_NAME}", applicantName)
    .replace("{SERVICE_CATEGORY}", serviceCategory)
    .replace("{SERVICE_DETAIL}", serviceDetail)
    .replace("{DEPARTMENT}", department || "Not provided");

  try {
    const OPENAI_BASE = process.env.LITELLM_BASE_URL
      ? `${process.env.LITELLM_BASE_URL}/openai`
      : "https://api.openai.com";
    const response = await fetch(`${OPENAI_BASE}/v1/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              {
                type: "input_image",
                image_url: `data:${mimeType};base64,${base64Data}`,
              },
            ],
          },
        ],
        max_output_tokens: 800,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[HeroAI] OpenAI error ${response.status}: ${errText}`);
      return fallbackResult(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract text from response
    const outputText =
      data.output?.[0]?.content?.[0]?.text ||
      data.choices?.[0]?.message?.content ||
      "";

    if (!outputText) {
      return fallbackResult("Empty response from AI");
    }

    // Parse JSON from the response
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackResult("Could not parse AI response", outputText);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      isLikelyValid: !!parsed.isLikelyValid,
      confidence: Math.max(0, Math.min(100, parsed.confidence ?? 0)),
      documentType: parsed.documentType || "Unknown",
      matchesCategory: !!parsed.matchesCategory,
      detectedCategory: parsed.detectedCategory || "UNKNOWN",
      nameFound: parsed.nameFound || null,
      nameMatchScore: Math.max(0, Math.min(100, parsed.nameMatchScore ?? 0)),
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      summary: parsed.summary || "No summary provided",
      rawAnalysis: outputText,
    };
  } catch (err: any) {
    console.error("[HeroAI] Analysis failed:", err);
    return fallbackResult(`Analysis error: ${err?.message || "Unknown"}`);
  }
}

function fallbackResult(reason: string, rawAnalysis = ""): AiVerificationResult {
  return {
    isLikelyValid: false,
    confidence: 0,
    documentType: "Unknown",
    matchesCategory: false,
    detectedCategory: null,
    nameFound: null,
    nameMatchScore: 0,
    flags: [reason],
    summary: `AI verification unavailable: ${reason}. Manual review required.`,
    rawAnalysis,
  };
}
