import fs from "fs/promises";
import path from "path";
import heicConvert from "heic-convert";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"]);
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export const storageAdapter = {
  async savePhoto(file: File, itemId: string): Promise<string> {
    // Validate MIME type (HEIC files may arrive with empty type from some browsers)
    const rawExt = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTS.has(rawExt)) {
      throw new Error(`Invalid file type: ${file.type || rawExt}. Allowed: JPEG, PNG, WebP, GIF, HEIC.`);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Max: 15MB.`);
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    let buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = (file.type ?? "").toLowerCase();
    const fileName_ = (file.name ?? "").toLowerCase();
    const isHeic = mimeType.includes("heic") || mimeType.includes("heif") || fileName_.endsWith(".heic") || fileName_.endsWith(".heif");

    // Convert HEIC/HEIF to JPEG so all browsers can display it
    let finalExt: string;
    if (isHeic) {
      console.log("[photo-upload] HEIC detected — converting to JPEG");
      const jpegBuffer = await heicConvert({
        buffer: buffer,
        format: "JPEG",
        quality: 0.9,
      });
      buffer = Buffer.from(jpegBuffer);
      finalExt = "jpg";
      console.log("[photo-upload] HEIC conversion complete, size:", buffer.length);
    } else {
      const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
      finalExt = ALLOWED_EXTS.has(ext) ? ext : "jpg";
    }

    const fileName = `${itemId}-${Date.now()}.${finalExt}`;
    const absPath = path.join(uploadsDir, fileName);

    await fs.writeFile(absPath, buffer);

    return `/uploads/${fileName}`;
  },

  async saveDocument(
    buffer: Buffer,
    itemId: string,
    originalName: string,
    mimeType: string
  ): Promise<string> {
    const DOC_TYPES = new Set([
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
    const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25 MB

    const rawExt = (originalName.split(".").pop() || "").toLowerCase();
    if (!DOC_TYPES.has(mimeType) && !rawExt) {
      throw new Error(`Unsupported document type: ${mimeType}`);
    }

    if (buffer.length > MAX_DOC_SIZE) {
      throw new Error(`Document too large (${Math.round(buffer.length / 1024 / 1024)}MB). Max: 25MB.`);
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = rawExt || "bin";
    const fileName = `${itemId}-doc-${Date.now()}.${ext}`;
    const absPath = path.join(uploadsDir, fileName);

    await fs.writeFile(absPath, buffer);

    return `/uploads/${fileName}`;
  },
};