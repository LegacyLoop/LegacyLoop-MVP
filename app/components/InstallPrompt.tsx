"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * CMD-PWA-INSTALL: Smart install prompt for PWA.
 *
 * Listens for the browser's `beforeinstallprompt` event, then shows
 * a branded bottom banner on mobile. Auto-dismisses after 30s.
 * Only shows once per session (sessionStorage).
 *
 * Does NOT show if:
 *   - Already installed (display-mode: standalone)
 *   - Already dismissed this session
 *   - Desktop (> 768px — install prompt is less relevant)
 *   - Browser doesn't support PWA install
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Skip if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Skip if already dismissed this session
    if (sessionStorage.getItem("ll-pwa-dismissed")) return;
    // Skip on desktop
    if (window.innerWidth > 768) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Auto-dismiss after 30 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("ll-pwa-dismissed", "1");
    }, 30000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("[PWA] User accepted install");
        // Log install event
        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "PWA_INSTALL", title: "App installed", message: "LegacyLoop was added to home screen" }),
          });
        } catch { /* non-critical */ }
      }
    } catch { /* prompt failed */ }
    setDeferredPrompt(null);
    setVisible(false);
    sessionStorage.setItem("ll-pwa-dismissed", "1");
    setInstalling(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem("ll-pwa-dismissed", "1");
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        padding: "0.75rem 1rem",
        background: "rgba(10, 10, 18, 0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0, 188, 212, 0.2)",
        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.4)",
        animation: "slideUpInstall 0.35s ease forwards",
      }}
    >
      <style>{`
        @keyframes slideUpInstall {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        {/* App icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/icon-192.png"
          alt="LegacyLoop"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0, 188, 212, 0.3)",
          }}
        />

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.88rem",
              fontWeight: 700,
              color: "#f1f5f9",
              lineHeight: 1.3,
            }}
          >
            Get the LegacyLoop App
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "#94a3b8",
              lineHeight: 1.3,
              marginTop: "0.1rem",
            }}
          >
            Add to home screen for fast access
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <button
            onClick={handleDismiss}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: "0.75rem",
              fontWeight: 500,
              cursor: "pointer",
              padding: "0.4rem 0.5rem",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            disabled={installing}
            style={{
              background: "linear-gradient(135deg, #22d3ee, #0097a7)",
              color: "#fff",
              border: "none",
              padding: "0.55rem 1.1rem",
              borderRadius: "0.55rem",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: installing ? "wait" : "pointer",
              boxShadow: "0 2px 10px rgba(0, 188, 212, 0.3)",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              opacity: installing ? 0.7 : 1,
            }}
          >
            {installing ? "Installing..." : "Install"}
          </button>
        </div>
      </div>
    </div>
  );
}
