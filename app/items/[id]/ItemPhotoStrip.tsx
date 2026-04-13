"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Photo = {
  id: string;
  filePath: string;
  isPrimary: boolean;
};

// ═══ HAPTIC FEEDBACK HELPER ═══
function haptic() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(8);
  }
}

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

  // ═══ CAROUSEL STATE ═══
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);

  // Ordered photos: primary first, then the rest
  const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];
  const orderedPhotos = primaryPhoto
    ? [primaryPhoto, ...photos.filter((p) => p.id !== primaryPhoto.id)]
    : photos;

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

  // Carousel navigation
  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0) setCurrentIndex(0);
      else if (index >= orderedPhotos.length) setCurrentIndex(orderedPhotos.length - 1);
      else setCurrentIndex(index);
    },
    [orderedPhotos.length],
  );

  // ═══ TOUCH HANDLERS — CAROUSEL ═══
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > 50) {
      haptic();
      if (delta > 0) goToSlide(currentIndex + 1);
      else goToSlide(currentIndex - 1);
    }
  }, [currentIndex, goToSlide]);

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

  // ═══ NO PHOTOS STATE ═══
  if (photos.length === 0) {
    return (
      <div style={{ marginTop: "1.5rem" }}>
        <div
          style={{
            width: "100%",
            aspectRatio: "4 / 3",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            border: "1px solid var(--border-default)",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00BCD4"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            No photos yet
          </span>
        </div>
      </div>
    );
  }

  // ═══ SINGLE PHOTO ═══
  if (photos.length === 1) {
    const photo = orderedPhotos[0];
    return (
      <div style={{ marginTop: "1.5rem" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            overflow: "hidden",
            borderRadius: "12px",
            background: "#0D1117",
            cursor: "pointer",
          }}
          onClick={() =>
            setViewingPhoto({
              id: photo.id,
              filePath: photo.filePath,
              index: 0,
            })
          }
        >
          <img
            src={photo.filePath}
            alt={displayTitle}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
            }}
          />
        </div>

        {/* Single photo lightbox */}
        {viewingPhoto && (
          <LightboxModal
            photos={photos}
            viewingPhoto={viewingPhoto}
            setViewingPhoto={setViewingPhoto}
            goTo={goTo}
          />
        )}
      </div>
    );
  }

  // ═══ MULTI-PHOTO CAROUSEL ═══
  return (
    <>
      <div style={{ marginTop: "1.5rem" }}>
        {/* Carousel container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            overflow: "hidden",
            borderRadius: "12px",
            background: "#0D1117",
          }}
        >
          {/* Photo counter — top right */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(0,0,0,0.55)",
              color: "#ffffff",
              fontSize: "0.75rem",
              padding: "3px 8px",
              borderRadius: "20px",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              fontFamily: "var(--font-data)",
              fontWeight: 600,
              zIndex: 2,
              letterSpacing: "0.02em",
            }}
          >
            {currentIndex + 1} / {orderedPhotos.length}
          </div>

          {/* Sliding photo strip */}
          <div
            style={{
              display: "flex",
              width: `${orderedPhotos.length * 100}%`,
              transform: `translateX(-${currentIndex * (100 / orderedPhotos.length)}%)`,
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              height: "100%",
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {orderedPhotos.map((photo, i) => (
              <div
                key={photo.id}
                style={{
                  width: `${100 / orderedPhotos.length}%`,
                  height: "100%",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
                onClick={() =>
                  setViewingPhoto({
                    id: photo.id,
                    filePath: photo.filePath,
                    index: photos.indexOf(photo),
                  })
                }
              >
                <img
                  src={photo.filePath}
                  alt={displayTitle}
                  draggable={false}
                  loading={i === 0 ? "eager" : "lazy"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "center",
                    display: "block",
                    userSelect: "none",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Desktop prev/next arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(currentIndex - 1);
            }}
            aria-label="Previous photo"
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.45)",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: currentIndex === 0 ? "none" : "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#ffffff",
              fontSize: "1.1rem",
              zIndex: 2,
              backdropFilter: "blur(4px)",
              transition: "background 0.2s",
            }}
          >
            &#8249;
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(currentIndex + 1);
            }}
            aria-label="Next photo"
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.45)",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: currentIndex === orderedPhotos.length - 1 ? "none" : "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#ffffff",
              fontSize: "1.1rem",
              zIndex: 2,
              backdropFilter: "blur(4px)",
              transition: "background 0.2s",
            }}
          >
            &#8250;
          </button>
        </div>

        {/* Dot indicators */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            justifyContent: "center",
            marginTop: "8px",
          }}
        >
          {orderedPhotos.map((photo, i) => (
            <button
              key={photo.id}
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => goToSlide(i)}
              style={{
                width: currentIndex === i ? "8px" : "6px",
                height: currentIndex === i ? "8px" : "6px",
                borderRadius: "50%",
                background:
                  currentIndex === i ? "#00BCD4" : "rgba(255,255,255,0.35)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* ═══ LIGHTBOX ═══ */}
      {viewingPhoto && (
        <LightboxModal
          photos={photos}
          viewingPhoto={viewingPhoto}
          setViewingPhoto={setViewingPhoto}
          goTo={goTo}
        />
      )}
    </>
  );
}

// ═══ LIGHTBOX MODAL — pinch-to-zoom + swipe ═══
// LIGHTBOX IS VIEW-ONLY — no cover photo changes, no edits, no deletes
function LightboxModal({
  photos,
  viewingPhoto,
  setViewingPhoto,
  goTo,
}: {
  photos: Photo[];
  viewingPhoto: { id: string; filePath: string; index: number };
  setViewingPhoto: (v: { id: string; filePath: string; index: number } | null) => void;
  goTo: (delta: number) => void;
}) {
  // ═══ PINCH-TO-ZOOM STATE ═══
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const initialPinchDistance = useRef(0);
  const initialScale = useRef(1);
  const isPinching = useRef(false);

  // Pan state (when zoomed)
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);

  // Swipe state (single finger, not zoomed)
  const swipeStartX = useRef(0);
  const swipeEndX = useRef(0);
  const isSwiping = useRef(false);

  // Double-tap state
  const lastTap = useRef(0);

  // Reset zoom when photo changes
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [viewingPhoto.id]);

  function getFingerDistance(t1: React.Touch, t2: React.Touch) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  const onImageTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      isPinching.current = true;
      isSwiping.current = false;
      isPanning.current = false;
      initialPinchDistance.current = getFingerDistance(e.touches[0], e.touches[1]);
      initialScale.current = scale;
    } else if (e.touches.length === 1) {
      // Double-tap detection
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // Double tap — toggle zoom
        if (scale > 1.1) {
          setScale(1);
          setTranslate({ x: 0, y: 0 });
        } else {
          setScale(2.5);
          setTranslate({ x: 0, y: 0 });
        }
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;

      if (scale > 1.1) {
        // Panning when zoomed
        isPanning.current = true;
        isSwiping.current = false;
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        translateStart.current = { ...translate };
      } else {
        // Swipe for navigation
        isSwiping.current = true;
        isPanning.current = false;
        swipeStartX.current = e.touches[0].clientX;
        swipeEndX.current = e.touches[0].clientX;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, translate]);

  const onImageTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPinching.current && e.touches.length === 2) {
      const dist = getFingerDistance(e.touches[0], e.touches[1]);
      const newScale = Math.min(
        Math.max(initialScale.current * (dist / initialPinchDistance.current), 1),
        5,
      );
      setScale(newScale);
      // Reset translate if returning to 1x
      if (newScale <= 1.05) setTranslate({ x: 0, y: 0 });
    } else if (isPanning.current && e.touches.length === 1) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setTranslate({
        x: translateStart.current.x + dx,
        y: translateStart.current.y + dy,
      });
    } else if (isSwiping.current && e.touches.length === 1) {
      swipeEndX.current = e.touches[0].clientX;
    }
  }, []);

  const onImageTouchEnd = useCallback(() => {
    if (isPinching.current) {
      isPinching.current = false;
      // Snap to 1x if close
      if (scale < 1.15) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
    }
    if (isPanning.current) {
      isPanning.current = false;
    }
    if (isSwiping.current) {
      isSwiping.current = false;
      const delta = swipeStartX.current - swipeEndX.current;
      if (Math.abs(delta) > 50) {
        haptic();
        if (delta > 0) goTo(1);
        else goTo(-1);
      }
    }
  }, [scale, goTo]);

  return (
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
        {/* Main image — pinch-to-zoom + swipe */}
        <div
          style={{
            overflow: "hidden",
            borderRadius: "12px",
            touchAction: scale > 1.1 ? "none" : "pan-y",
          }}
          onTouchStart={onImageTouchStart}
          onTouchMove={onImageTouchMove}
          onTouchEnd={onImageTouchEnd}
        >
          <img
            src={viewingPhoto.filePath}
            alt="Item photo"
            draggable={false}
            style={{
              maxWidth: "85vw",
              maxHeight: "78vh",
              objectFit: "contain",
              display: "block",
              userSelect: "none",
              transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              transition: isPinching.current || isPanning.current ? "none" : "transform 0.2s ease-out",
              willChange: "transform",
            }}
          />
        </div>

        {/* Zoom indicator — shows when zoomed */}
        {scale > 1.1 && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "rgba(0,0,0,0.55)",
              color: "#ffffff",
              fontSize: "0.7rem",
              padding: "3px 8px",
              borderRadius: "20px",
              backdropFilter: "blur(4px)",
              fontFamily: "var(--font-data)",
              fontWeight: 600,
            }}
          >
            {scale.toFixed(1)}x
          </div>
        )}

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
                loading="lazy"
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
        &#10005;
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
            &#8249;
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
            &#8250;
          </button>
        </>
      )}
    </div>
  );
}
