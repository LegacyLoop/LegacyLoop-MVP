import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { storageAdapter } from "@/lib/adapters/storage";
import fs from "fs";
import path from "path";

// POST: add more photos to an existing item
export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) return new Response("Not found", { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("photos[]") as File[];
  const validFiles = files.filter((f) => f && f.size > 0).slice(0, 10);
  if (!validFiles.length) return new Response("No photos", { status: 400 });

  // Get current photo count for ordering
  const existing = await prisma.itemPhoto.count({ where: { itemId } });
  const added: string[] = [];

  for (let i = 0; i < validFiles.length; i++) {
    const order = existing + i + 1;
    const filePath = await storageAdapter.savePhoto(validFiles[i], itemId);
    await prisma.itemPhoto.create({
      data: { itemId, filePath, order, isPrimary: existing === 0 && i === 0 },
    });
    added.push(filePath);
  }

  return Response.json({ ok: true, added: added.length, paths: added });
}

// DELETE: remove a specific photo
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) return new Response("Not found", { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { photoId } = body;

  const photo = await prisma.itemPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.itemId !== itemId) return new Response("Photo not found", { status: 404 });

  // Delete the file
  try {
    const abs = path.join(process.cwd(), "public", photo.filePath.replace(/^\//, ""));
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch { /* ignore file errors */ }

  await prisma.itemPhoto.delete({ where: { id: photoId } });

  // If deleted primary, promote next photo
  if (photo.isPrimary) {
    const next = await prisma.itemPhoto.findFirst({ where: { itemId }, orderBy: { order: "asc" } });
    if (next) await prisma.itemPhoto.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  return Response.json({ ok: true });
}

// PATCH: set primary photo or reorder
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) return new Response("Not found", { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { setPrimary, photoId } = body;

  if (setPrimary && photoId) {
    // Clear all primary flags, set new one
    await prisma.itemPhoto.updateMany({ where: { itemId }, data: { isPrimary: false } });
    await prisma.itemPhoto.update({ where: { id: photoId }, data: { isPrimary: true, order: 1 } });
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: "Unknown operation" }, { status: 400 });
}
