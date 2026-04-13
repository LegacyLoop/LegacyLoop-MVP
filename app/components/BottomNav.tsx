"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

/* ── Haptic ── */
function haptic(ms = 6) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(ms);
    }
  } catch {
    // Some iOS Safari versions throw on vibrate() — silent fail
  }
}

/* ── Tab definitions ── */
const TABS = [
  {
    href: "/dashboard",
    label: "Home",
    match: ["/dashboard"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#00BCD4" : "rgba(255,255,255,0.45)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/items",
    label: "Items",
    match: ["/items", "/store"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#00BCD4" : "rgba(255,255,255,0.45)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: "/items/new",
    label: "",
    match: ["/items/new"],
    isCenter: true,
    icon: (_active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    href: "/bots",
    label: "Bots",
    match: ["/bots"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#00BCD4" : "rgba(255,255,255,0.45)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: "/subscription",
    label: "Account",
    match: ["/subscription", "/settings", "/billing", "/credits", "/profile"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#00BCD4" : "rgba(255,255,255,0.45)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

/* ── Component ── */
export default function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [tapped, setTapped] = useState<string | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Bounce animation on tap — clear after 200ms
  const handleTap = (href: string, isCenter = false) => {
    haptic(isCenter ? 12 : 6);
    setTapped(href);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTapped(null), 200);
  };

  if (!isMobile) return null;

  return (
    <>
      <style>{`
        @keyframes softPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes unreadPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        @keyframes dotAppear {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
        .bottom-nav-tab:focus-visible,
        .bottom-nav-center-btn:focus-visible {
          outline: 2px solid #00BCD4;
          outline-offset: 2px;
          border-radius: 8px;
        }
        @media (prefers-reduced-motion: reduce) {
          .bottom-nav-tab,
          .bottom-nav-center-btn,
          .bottom-nav-active-dot,
          .soft-pulse-ring,
          .unread-dot {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
      <nav
        className="glass-nav"
        aria-label="Primary"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "64px",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
          paddingLeft: "env(safe-area-inset-left, 8px)",
          paddingRight: "env(safe-area-inset-right, 8px)",
          borderTop: "1px solid var(--glass-border)",
          borderBottom: "none",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
          const isBouncing = tapped === tab.href;

          /* ── Center + Button ── */
          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="bottom-nav-center-btn"
                aria-label="Add new item"
                onClick={() => handleTap(tab.href, true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #00BCD4, #0097A7)",
                  boxShadow:
                    "0 0 0 4px rgba(0,188,212,0.15), 0 4px 16px rgba(0,188,212,0.4)",
                  marginTop: "-20px",
                  transform: isBouncing ? "scale(0.92)" : "scale(1)",
                  transition: "transform 0.15s ease",
                  textDecoration: "none",
                  position: "relative",
                  WebkitTouchCallout: "none",
                }}
              >
                {/* Pulse ring */}
                <div
                  className="soft-pulse-ring"
                  style={{
                    position: "absolute",
                    inset: "-4px",
                    borderRadius: "50%",
                    border: "2px solid rgba(0,188,212,0.2)",
                    animation: "softPulse 3s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />
                {tab.icon(false)}
              </Link>
            );
          }

          /* ── Regular Tab ── */
          const isMessages = tab.href === "/bots"; // Bots tab — not messages
          const showUnreadDot = tab.label === "Home" ? false : false; // placeholder

          // Messages tab detection for unread badge
          // BottomNav doesn't have a Messages tab currently, so badge is not wired.
          // If a Messages tab is added, wire unreadCount here.

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="bottom-nav-tab"
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleTap(tab.href)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                padding: "6px 12px",
                textDecoration: "none",
                position: "relative",
                transform: isBouncing
                  ? "scale(1.15)"
                  : isActive
                  ? "scale(1.1)"
                  : "scale(1)",
                transition:
                  "color 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease",
                WebkitTouchCallout: "none",
              }}
            >
              {/* Active dot */}
              {isActive && (
                <div
                  className="bottom-nav-active-dot"
                  style={{
                    position: "absolute",
                    top: "0px",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#00BCD4",
                    animation: "dotAppear 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards",
                  }}
                />
              )}

              {/* Icon wrapper — for relative badge positioning */}
              <div style={{ position: "relative", display: "flex" }}>
                {tab.icon(isActive)}
              </div>

              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#00BCD4" : "rgba(255,255,255,0.45)",
                  letterSpacing: "0.02em",
                  transition: "color 0.2s ease",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
