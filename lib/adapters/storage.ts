import fs from "fs/promises";
import path from "path";
import heicConvert from "heic-convert";
import { v2 as cloudinary } from "cloudinary";

// CMD-CLOUDINARY-STORAGE: Configure Cloudinary when credentials are present.
// Config is lazy — only runs once on first import. If env vars are missing,
// the local disk fallback handles everything (zero breaking change).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** Check if Cloudinary storage is enabled and properly configured. */
const useCloudinary = () =>
  process.env.SSTORAGE === "cloudinary" &&
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY;

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

    // ── Cloudinary upload path ────────────────────────────────────
    if (useCloudinary()) {
      try {
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `legacyloop/items/${itemId}`,
              resource_type: "image",
              format: finalExt === "jpg" ? "jpg" : undefined,
              transformation: [
                { quality: "auto:good" },
                { fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error || !result) reject(error ?? new Error("Cloudinary upload returned no result"));
              else resolve(result as { secure_url: string });
            },
          );
          uploadStream.end(buffer);
        });
        console.log(`[photo-upload] Cloudinary: uploaded ${(buffer.length / 1024).toFixed(0)}KB → ${result.secure_url.slice(0, 80)}...`);
        return result.secure_url;
      } catch (err: any) {
        console.error("[photo-upload] Cloudinary upload failed, falling back to local:", err.message);
        // Fall through to local disk as safety net
      }
    }

    // ── Local disk fallback (original logic, unchanged) ───────────
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

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

    // ── Cloudinary upload path ────────────────────────────────────
    if (useCloudinary()) {
      try {
        const isImage = mimeType.startsWith("image/");
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `legacyloop/items/${itemId}/docs`,
              resource_type: isImage ? "image" : "auto",
            },
            (error, result) => {
              if (error || !result) reject(error ?? new Error("Cloudinary upload returned no result"));
              else resolve(result as { secure_url: string });
            },
          );
          uploadStream.end(buffer);
        });
        console.log(`[doc-upload] Cloudinary: uploaded ${(buffer.length / 1024).toFixed(0)}KB → ${result.secure_url.slice(0, 80)}...`);
        return result.secure_url;
      } catch (err: any) {
        console.error("[doc-upload] Cloudinary upload failed, falling back to local:", err.message);
        // Fall through to local disk as safety net
      }
    }

    // ── Local disk fallback (original logic, unchanged) ───────────
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = rawExt || "bin";
    const fileName = `${itemId}-doc-${Date.now()}.${ext}`;
    const absPath = path.join(uploadsDir, fileName);

    await fs.writeFile(absPath, buffer);

    return `/uploads/${fileName}`;
  },
};
