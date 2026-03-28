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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const docType = String(formData.get("docType") || "OTHER").trim();
  const label = formData.get("label") ? String(formData.get("label")).trim() : null;

  if (!file || file.size === 0) return new Response("No file provided", { status: 400 });

  // Validate MIME type
  const rawExt = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_DOC_TYPES.has(file.type) && !rawExt) {
    return new Response(`Unsupported file type: ${file.type}`, { status: 400 });
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
