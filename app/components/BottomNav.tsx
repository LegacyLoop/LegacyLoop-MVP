"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function BottomNav() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile) return null;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        background: "rgba(13,17,23,0.95)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        paddingLeft: "8px",
        paddingRight: "8px",
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.match.some((m) => pathname === m || pathname.startsWith(m + "/"));

        if (tab.isCenter) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #00BCD4, #0097a7)",
                boxShadow: "0 4px 16px rgba(0,188,212,0.35)",
                marginTop: "-20px",
                transition: "transform 150ms ease",
                textDecoration: "none",
              }}
            >
              {tab.icon(false)}
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
              padding: "6px 12px",
              textDecoration: "none",
              transition: "transform 150ms ease",
              position: "relative",
            }}
          >
            {isActive && (
              <div style={{
                position: "absolute",
                top: "0px",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: "#00BCD4",
              }} />
            )}
            {tab.icon(isActive)}
            <span style={{
              fontSize: "0.6rem",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#00BCD4" : "rgba(255,255,255,0.45)",
              letterSpacing: "0.02em",
            }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
