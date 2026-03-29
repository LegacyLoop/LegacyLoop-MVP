"use client";

import { useState, useEffect, useCallback } from "react";

type Photo = {
  id: string;
  filePath: string;
  isPrimary: boolean;
};

// LIGHTBOX IS VIEW-ONLY — no cover photo changes, no edits, no deletes

export default function ItemPhotoStrip({
  photos,
  displayTitle,
}: {
  photos: Photo[];
  displayTitle: string;
}) {
  const [viewingPhoto, setViewingPhoto] = useState<{
    id: string;
    filePath: string;
    index: number;
  } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];
  const secondaryPhotos = photos.filter((p) => p.id !== primaryPhoto?.id).slice(0, 6);

  // Navigation helpers
  const goTo = useCallback(
    (delta: number) => {
      if (!viewingPhoto) return;
      const next = (viewingPhoto.index + delta + photos.length) % photos.length;
      const p = photos[next];
      if (p) setViewingPhoto({ id: p.id, filePath: p.filePath, index: next });
    },
    [viewingPhoto, photos],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!viewingPhoto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setViewingPhoto(null);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(-1);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewingPhoto, goTo]);

  if (photos.length === 0) return null;

  return (
    <>
      <div style={{ marginTop: "1.5rem" }}>
        {/* Primary photo */}
        {primaryPhoto && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                position: "relative" as const,
                borderRadius: "1rem",
                overflow: "hidden",
                border: "1px solid var(--border-default)",
                maxWidth: 480,
                width: "100%",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
              onMouseEnter={() => setHoveredId(primaryPhoto.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() =>
                setViewingPhoto({
                  id: primaryPhoto.id,
                  filePath: primaryPhoto.filePath,
                  index: photos.indexOf(primaryPhoto),
                })
              }
            >
              <img
                src={primaryPhoto.filePath}
                alt={displayTitle}
                style={{
                  width: "100%",
                  maxHeight: 420,
                  objectFit: "cover",
                  display: "block",
                  transition: "transform 0.3s ease",
                  transform: hoveredId === primaryPhoto.id ? "scale(1.02)" : "scale(1)",
                }}
              />
              {/* Photo counter badge */}
              {photos.length > 1 && (
                <div style={{
                  position: "absolute", bottom: "8px", right: "8px",
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  borderRadius: "0.35rem", padding: "0.15rem 0.45rem",
                  fontSize: "0.65rem", fontWeight: 700, backdropFilter: "blur(4px)",
                }}>
                  1/{photos.length}
                </div>
              )}
              {/* Hover magnifier overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.35)",
                  borderRadius: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: hoveredId === primaryPhoto.id ? 1 : 0,
                  transition: "opacity 0.2s",
                  pointerEvents: "none",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>🔍</span>
              </div>
              {/* COVER badge on primary */}
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "8px",
                  background: "rgba(0,188,212,0.85)",
                  color: "white",
                  borderRadius: "4px",
                  padding: "0.1rem 0.35rem",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                COVER
              </div>
            </div>
          </div>
        )}

        {/* Thumbnails */}
        {secondaryPhotos.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "center",
              marginTop: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            {secondaryPhotos.map((p) => {
              const idx = photos.indexOf(p);
              return (
                <div
                  key={p.id}
                  style={{
                    position: "relative",
                    width: 56,
                    height: 56,
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                    border: "1px solid var(--border-default)",
                    flexShrink: 0,
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() =>
                    setViewingPhoto({ id: p.id, filePath: p.filePath, index: idx })
                  }
                >
                  <img
                    src={p.filePath}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      opacity: 0.85,
                    }}
                  />
                  {/* Hover magnifier overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.35)",
                      borderRadius: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: hoveredId === p.id ? 1 : 0,
                      transition: "opacity 0.2s",
                      pointerEvents: "none",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>🔍</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ LIGHTBOX ═══ */}
      {/* LIGHTBOX IS VIEW-ONLY — no cover photo changes, no edits, no deletes */}
      {viewingPhoto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setViewingPhoto(null)}
        >
          {/* Image container — stop propagation so clicking image doesn't close */}
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main image */}
            <img
              src={viewingPhoto.filePath}
              alt="Item photo"
              style={{
                maxWidth: "85vw",
                maxHeight: "78vh",
                objectFit: "contain",
                borderRadius: "12px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                display: "block",
              }}
            />

            {/* Image counter pill */}
            <div
              style={{
                background: "var(--ghost-bg)",
                border: "1px solid var(--border-default)",
                borderRadius: "20px",
                padding: "0.35rem 1rem",
                color: "var(--text-secondary)",
                fontSize: "0.82rem",
                fontWeight: 500,
              }}
            >
              {viewingPhoto.index + 1} of {photos.length}
            </div>

            {/* Thumbnail strip in lightbox */}
            {photos.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  maxWidth: "80vw",
                }}
              >
                {photos.map((p, i) => (
                  <img
                    key={p.id}
                    src={p.filePath}
                    alt=""
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "6px",
                      objectFit: "cover",
                      cursor: "pointer",
                      border:
                        viewingPhoto.id === p.id
                          ? "2px solid #00bcd4"
                          : "2px solid transparent",
                      opacity: viewingPhoto.id === p.id ? 1 : 0.5,
                      transition: "all 0.2s",
                    }}
                    onClick={() =>
                      setViewingPhoto({ id: p.id, filePath: p.filePath, index: i })
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Close button (fixed top right) */}
          <button
            onClick={() => setViewingPhoto(null)}
            style={{
              position: "fixed",
              top: "1.25rem",
              right: "1.25rem",
              background: "var(--bg-card-hover)",
              border: "1px solid var(--border-default)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "white",
              fontSize: "1.1rem",
              zIndex: 10000,
              backdropFilter: "blur(8px)",
            }}
          >
            ✕
          </button>

          {/* Prev / Next buttons (only if more than 1 photo) */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(-1);
                }}
                style={{
                  position: "fixed",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "var(--ghost-bg)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "50%",
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "1.1rem",
                  zIndex: 10000,
                  backdropFilter: "blur(8px)",
                  transition: "background 0.2s",
                }}
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(1);
                }}
                style={{
                  position: "fixed",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "var(--ghost-bg)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "50%",
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "1.1rem",
                  zIndex: 10000,
                  backdropFilter: "blur(8px)",
                  transition: "background 0.2s",
                }}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
