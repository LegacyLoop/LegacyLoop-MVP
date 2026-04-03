import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { storageAdapter } from "@/lib/adapters/storage";
import { summarizeDocument } from "@/lib/documents/summarize";
import { logUserEvent } from "@/lib/data/user-events";
import fs from "fs";
import path from "path";

type Params = Promise<{ itemId: string }>;

const ALLOWED_DOC_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "text/plain", "text/rtf", "application/rtf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

const MAX_SIZE = 25 * 1024 * 1024;

/** GET /api/items/documents/[itemId] — list documents */
export async function GET(
  _req: Request,
  { params }: { params: Params }
) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
  if (!item || item.userId !== user.id) return new Response("Not found", { status: 404 });

  const docs = await prisma.itemDocument.findMany({
    where: { itemId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, fileName: true, fileUrl: true, fileType: true,
      fileSizeBytes: true, docType: true, label: true,
      aiSummary: true, aiAnalysis: true, confidenceScore: true,
      providerResults: true, createdAt: true,
    },
  });

  return Response.json(docs);
}

/** POST /api/items/documents/[itemId] — upload document */
export async function POST(
  req: Request,
  { params }: { params: Params }
) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
  if (!item || item.userId !== user.id) return new Response("Not found", { status: 404 });

  // Credit check for document AI analysis (1 credit) — skipped in demo mode
  const { isDemoMode } = await import("@/lib/bot-mode");
  if (!isDemoMode()) {
    const { checkCredits, deductCredits } = await import("@/lib/credits");
    const cc = await checkCredits(user.id, 1);
    if (!cc.hasEnough) {
      return Response.json(
        { error: "insufficient_credits", message: "1 credit required for document analysis.", balance: cc.balance, required: 1, buyUrl: "/credits" },
        { status: 402 }
      );
    }
    await deductCredits(user.id, 1, "Document analysis", itemId);
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const docType = String(formData.get("docType") || "OTHER").trim();
  const label = formData.get("label") ? String(formData.get("label")).trim() : null;

  if (!file || file.size === 0) return new Response("No file provided", { status: 400 });

  // Validate MIME type — strict allowlist, both MIME and extension must pass
  const rawExt = (file.name.split(".").pop() || "").toLowerCase();
  const ALLOWED_EXTENSIONS = new Set([
    "jpg", "jpeg", "png", "webp", "heic", "gif",
    "pdf", "doc", "docx", "odt", "txt", "rtf",
    "xls", "xlsx", "csv",
  ]);
  if (!ALLOWED_DOC_TYPES.has(file.type)) {
    return new Response(`Unsupported file type: ${file.type}. Accepted: images, PDFs, Word docs, spreadsheets, text files.`, { status: 400 });
  }
  if (rawExt && !ALLOWED_EXTENSIONS.has(rawExt)) {
    return new Response(`Unsupported file extension: .${rawExt}`, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return new Response(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Max: 25MB.`, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await storageAdapter.saveDocument(buffer, itemId, file.name, file.type);

    const doc = await prisma.itemDocument.create({
      data: {
        itemId,
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        fileSizeBytes: file.size,
        docType,
        label,
      },
    });

    // Fire-and-forget AI summary + user event
    summarizeDocument(doc.id, fileUrl, file.type, docType).catch((e) =>
      console.error("[doc-summarize] Fire-and-forget failed:", e.message)
    );
    logUserEvent(user.id, "DOCUMENT_UPLOADED", { itemId, metadata: { docType } }).catch(() => null);

    return Response.json(doc);
  } catch (e: any) {
    console.error("[documents POST]", e);
    return new Response(e.message || "Upload failed", { status: 500 });
  }
}

/** DELETE /api/items/documents/[itemId] — remove document */
export async function DELETE(
  req: Request,
  { params }: { params: Params }
) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
  if (!item || item.userId !== user.id) return new Response("Not found", { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { documentId } = body;
  if (!documentId) return new Response("documentId required", { status: 400 });

  const doc = await prisma.itemDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.itemId !== itemId) return new Response("Document not found", { status: 404 });

  // Delete file from disk
  try {
    const abs = path.join(process.cwd(), "public", doc.fileUrl.replace(/^\//, ""));
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch { /* ignore file errors */ }

  await prisma.itemDocument.delete({ where: { id: documentId } });

  return Response.json({ success: true });
}

/** PATCH /api/items/documents/[itemId] — re-analyze a document */
export async function PATCH(
  req: Request,
  { params }: { params: Params }
) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
  if (!item || item.userId !== user.id) return new Response("Not found", { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { documentId } = body;
  if (!documentId) return new Response("documentId required", { status: 400 });

  const doc = await prisma.itemDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.itemId !== itemId) return new Response("Document not found", { status: 404 });

  // Credit check: 1 credit for re-analysis
  const { checkCredits, deductCredits } = await import("@/lib/credits");
  const credits = await checkCredits(user.id, 1);
  if (!credits.hasEnough) {
    return Response.json(
      { error: "insufficient_credits", message: "1 credit required to re-analyze.", balance: credits.balance, required: 1, buyUrl: "/credits" },
      { status: 402 }
    );
  }
  await deductCredits(user.id, 1, "Document re-analysis", itemId);

  // Clear old analysis
  await prisma.itemDocument.update({
    where: { id: documentId },
    data: { aiSummary: null, aiAnalysis: null, confidenceScore: null, providerResults: null },
  });

  // Fire-and-forget re-analysis
  summarizeDocument(doc.id, doc.fileUrl, doc.fileType, doc.docType).catch((e) =>
    console.error("[doc-reanalyze] Fire-and-forget failed:", e.message)
  );

  return Response.json({ success: true, message: "Re-analysis started" });
}
