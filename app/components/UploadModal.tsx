"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera,
  ImagePlus,
  Cloud,
  Lock,
  X,
  Star,
  RotateCw,
  Trash2,
  GripVertical,
  Upload,
  Smartphone,
} from "lucide-react";

export type PhotoFile = {
  file: File;
  preview: string;
  id: string;
  uploading?: boolean;
  progress?: number;
};

type Props = {
  photos: PhotoFile[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
  maxPhotos?: number;
  tierLimit?: number;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return isHeic(file);
}

async function convertHeicIfNeeded(file: File): Promise<File> {
  if (!isHeic(file)) return file;
  try {
    const heic2any = (await import("heic2any")).default;
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const resultBlob = Array.isArray(blob) ? blob[0] : blob;
    return new File(
      [resultBlob],
      file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg"),
      { type: "image/jpeg" }
    );
  } catch {
    // If conversion fails, return original — Safari can handle HEIC natively
    return file;
  }
}

async function compressImage(file: File, maxSizeMB = 2): Promise<File> {
  if (file.size <= maxSizeMB * 1024 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 2048;
      let w = img.width;
      let h = img.height;

      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

function rotateImage(preview: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = preview;
  });
}

const UPLOAD_SOURCES = [
  {
    id: "camera",
    icon: Camera,
    label: "Camera",
    desc: "Take a photo with your camera",
    available: true,
    mobile: true,
  },
  {
    id: "library",
    icon: ImagePlus,
    label: "Photo Library",
    desc: "Choose from your photos or files",
    available: true,
    mobile: true,
  },
  {
    id: "google-drive",
    icon: Cloud,
    label: "Google Drive",
    desc: "Coming Soon",
    available: false,
    mobile: false,
  },
  {
    id: "cloud",
    icon: Cloud,
    label: "iCloud / Dropbox",
    desc: "Coming Soon",
    available: false,
    mobile: false,
  },
];

const MAX_FILE_SIZE_MB = 10;

export default function UploadModal({ photos, setPhotos, maxPhotos = 10, tierLimit }: Props) {
  const [showSources, setShowSources] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);
  const [cameraFile, setCameraFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const remaining = maxPhotos - photos.length;
  const limitDisplay = tierLimit ?? maxPhotos;

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setError("");
      const arr = Array.from(files).filter((f) => isImageFile(f));

      if (arr.length === 0) {
        setError("No valid image files selected.");
        return;
      }

      const oversized = arr.filter((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
      if (oversized.length > 0) {
        setError(`${oversized.length} file(s) exceed ${MAX_FILE_SIZE_MB}MB limit and were skipped.`);
      }

      const valid = arr
        .filter((f) => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024)
        .slice(0, remaining);

      if (valid.length === 0) return;

      const processed: PhotoFile[] = [];
      for (const file of valid) {
        const converted = await convertHeicIfNeeded(file);
        const compressed = await compressImage(converted);
        processed.push({
          file: compressed,
          preview: URL.createObjectURL(compressed),
          id: uid(),
          uploading: false,
          progress: 100,
        });
      }

      setPhotos((prev) => [...prev, ...processed]);
      setShowSources(false);
    },
    [remaining, setPhotos]
  );

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p) URL.revokeObjectURL(p.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const makePrimary = (id: string) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      return [item, ...next];
    });
  };

  const rotatePhoto = async (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;
    const rotated = await rotateImage(photo.preview);
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, preview: rotated }
          : p
      )
    );
  };

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setPhotos((prev) => {
      const next = [...prev];
      const [dragged] = next.splice(dragIdx, 1);
      next.splice(idx, 0, dragged);
      return next;
    });
    setDragIdx(idx);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleSourceClick = (sourceId: string) => {
    if (sourceId === "camera") {
      // On mobile, use input capture; on desktop, try getUserMedia
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        cameraInputRef.current?.click();
      } else {
        cameraInputRef.current?.click();
      }
    } else if (sourceId === "library") {
      fileInputRef.current?.click();
    }
    setShowSources(false);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setCameraPreview(preview);
    setCameraFile(file);
  };

  const acceptCameraPhoto = async () => {
    if (!cameraFile) return;
    const converted = await convertHeicIfNeeded(cameraFile);
    const compressed = await compressImage(converted);
    setPhotos((prev) => [
      ...prev,
      {
        file: compressed,
        preview: cameraPreview!,
        id: uid(),
        uploading: false,
        progress: 100,
      },
    ]);
    setCameraPreview(null);
    setCameraFile(null);
  };

  const retakePhoto = () => {
    if (cameraPreview) URL.revokeObjectURL(cameraPreview);
    setCameraPreview(null);
    setCameraFile(null);
    cameraInputRef.current?.click();
  };

  return (
    <div>
      {/* Camera preview modal */}
      {cameraPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <img
            src={cameraPreview}
            alt="Camera capture"
            style={{
              maxWidth: "90%",
              maxHeight: "60vh",
              borderRadius: "1rem",
              objectFit: "contain",
            }}
          />
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button
              onClick={retakePhoto}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retake
            </button>
            <button
              onClick={acceptCameraPhoto}
              className="btn-primary"
              style={{ padding: "0.75rem 1.5rem", fontSize: "0.9rem" }}
            >
              Use This Photo
            </button>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        style={{ display: "none" }}
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleCameraCapture}
      />

      {/* Tier limit indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <span className="label" style={{ marginBottom: 0 }}>
          Photos
        </span>
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 600,
            color: remaining <= 2 ? "#dc2626" : "var(--text-muted)",
          }}
        >
          {photos.length} of {limitDisplay} photos used
        </span>
      </div>

      {/* Drop zone / main upload area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => {
          if (photos.length === 0) setShowSources(true);
          else fileInputRef.current?.click();
        }}
        style={{
          border: `2px dashed ${dragging ? "var(--accent)" : "var(--border-default)"}`,
          borderRadius: "1rem",
          padding: photos.length === 0 ? "2.5rem 1.5rem" : "0.75rem",
          textAlign: "center",
          cursor: remaining > 0 ? "pointer" : "not-allowed",
          background: dragging ? "var(--accent-dim)" : "var(--bg-card-hover)",
          transition: "all 0.15s",
          opacity: remaining <= 0 ? 0.5 : 1,
        }}
      >
        {photos.length === 0 ? (
          <>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
              <Upload size={40} style={{ color: "var(--accent)", margin: "0 auto" }} />
            </div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              Drop photos here or tap to choose
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              JPG, PNG, WEBP, HEIC &middot; Up to {maxPhotos} photos &middot; Max {MAX_FILE_SIZE_MB}MB each
            </div>
          </>
        ) : remaining > 0 ? (
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            + Add more photos ({remaining} remaining)
          </div>
        ) : (
          <div style={{ fontSize: "0.82rem", color: "#dc2626" }}>
            Photo limit reached
          </div>
        )}
      </div>

      {/* Source picker cards */}
      {showSources && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.75rem",
            marginTop: "1rem",
          }}
        >
          {UPLOAD_SOURCES.map((src) => (
            <button
              key={src.id}
              onClick={() => src.available && handleSourceClick(src.id)}
              disabled={!src.available}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1.25rem 0.75rem",
                borderRadius: "0.875rem",
                border: `1px solid ${src.available ? "var(--border-default)" : "var(--border-default)"}`,
                background: src.available ? "var(--bg-card-hover)" : "transparent",
                cursor: src.available ? "pointer" : "not-allowed",
                opacity: src.available ? 1 : 0.5,
                transition: "all 0.15s",
              }}
            >
              {src.available ? (
                <src.icon size={24} style={{ color: "var(--accent)" }} />
              ) : (
                <Lock size={20} style={{ color: "var(--text-muted)" }} />
              )}
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: src.available ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {src.label}
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                }}
              >
                {src.desc}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.75rem",
            background: "rgba(220, 38, 38, 0.1)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            color: "#ef4444",
            fontSize: "0.82rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Photo grid with reorder */}
      {photos.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: "0.75rem",
              marginTop: "1rem",
            }}
          >
            {photos.map((p, i) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  position: "relative",
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  border: i === 0 ? "2.5px solid var(--accent)" : "2px solid var(--border-default)",
                  aspectRatio: "1",
                  cursor: "grab",
                  opacity: dragIdx === i ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                <img
                  src={p.preview}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                {/* Drag handle */}
                <div
                  style={{
                    position: "absolute",
                    top: "0.25rem",
                    left: "0.25rem",
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: "0.25rem",
                    padding: "0.15rem",
                    display: "flex",
                  }}
                >
                  <GripVertical size={12} color="#fff" />
                </div>

                {/* Primary badge */}
                {i === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0.3rem",
                      left: "1.5rem",
                      background: "var(--accent)",
                      color: "#fff",
                      fontSize: "0.55rem",
                      fontWeight: 800,
                      padding: "0.1rem 0.4rem",
                      borderRadius: "9999px",
                    }}
                  >
                    PRIMARY
                  </div>
                )}

                {/* Photo number */}
                <div
                  style={{
                    position: "absolute",
                    top: "0.3rem",
                    right: "0.3rem",
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    padding: "0.1rem 0.35rem",
                    borderRadius: "9999px",
                  }}
                >
                  {i + 1}
                </div>

                {/* Upload progress bar */}
                {p.uploading && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "1.75rem",
                      left: "0.3rem",
                      right: "0.3rem",
                      height: "3px",
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "2px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${p.progress ?? 0}%`,
                        background: "var(--accent)",
                        borderRadius: "2px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "rgba(0,0,0,0.65)",
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.2rem",
                    padding: "0.25rem",
                  }}
                >
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        makePrimary(p.id);
                      }}
                      title="Set as primary"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#fbbf24",
                        cursor: "pointer",
                        padding: "0.15rem",
                        display: "flex",
                      }}
                    >
                      <Star size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotatePhoto(p.id);
                    }}
                    title="Rotate"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      padding: "0.15rem",
                      display: "flex",
                    }}
                  >
                    <RotateCw size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(p.id);
                    }}
                    title="Remove"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#f87171",
                      cursor: "pointer",
                      padding: "0.15rem",
                      display: "flex",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Photo tips */}
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem 1rem",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-border)",
              borderRadius: "0.75rem",
              fontSize: "0.8rem",
              color: "var(--accent-theme)",
            }}
          >
            <strong>Best results:</strong> Front view (primary) &middot; Close-up of
            labels/brand &middot; Any damage &middot; Different angles
            {photos.length >= 3 && (
              <span style={{ marginLeft: "0.5rem", fontWeight: 700 }}>
                &middot; +{Math.min(photos.length - 1, 3) * 5}% confidence boost from{" "}
                {photos.length} photos!
              </span>
            )}
          </div>
        </>
      )}

      {/* Mobile: sticky upload button */}
      <div
        className="sm:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0.75rem 1rem",
          background: "var(--bg-primary)",
          borderTop: "1px solid var(--border-default)",
          zIndex: 100,
          display: photos.length === 0 && !showSources ? "block" : "none",
        }}
      >
        <button
          onClick={() => setShowSources(true)}
          className="btn-primary"
          style={{ width: "100%", padding: "0.875rem", fontSize: "1rem" }}
        >
          <Camera size={18} />
          Add Photos
        </button>
      </div>
    </div>
  );
}
