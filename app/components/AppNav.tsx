"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  MessageSquare,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Settings,
  ShoppingBag,
  CreditCard,
  Link2,
  Truck,
  Bot,
  BarChart3,
  HelpCircle,
  Command,
  Sparkles,
  Gift,
  Sun,
  Moon,
  Monitor,
  Coins,
  Search,
  Trophy,
  X,
  DollarSign,
} from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";

/* ── Types ────────────────────────────────────────────────────────────────── */

type NavUser = { id: string; email: string; tier: number; heroVerified?: boolean };
type Props = {
  user: NavUser | null;
  alertCount?: number;
  unreadCount?: number;
  creditBalance?: number;
};

type NotifItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

/* ── Constants ────────────────────────────────────────────────────────────── */

const TEAL      = "#00bcd4";
const TEAL_GLOW = "rgba(0, 188, 212, 0.35)";
const TEAL_BDR  = "rgba(0, 188, 212, 0.35)";

// Mobile page title map — friendly names for header
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/items": "My Items",
  "/items/new": "Add Item",
  "/bots": "AI Bots",
  "/messages": "Messages",
  "/subscription": "Membership",
  "/settings": "Settings",
  "/credits": "Credits",
  "/billing": "Billing",
  "/shipping": "Shipping",
  "/store": "My Store",
  "/marketplace": "Marketplace",
  "/projects": "Sales",
  "/analytics": "Analytics",
  "/payments": "Payments",
  "/help": "Help",
  "/profile": "Profile",
  "/referral": "Referrals",
  "/white-glove": "White Glove",
  "/pricing": "Pricing",
  "/search": "Search",
  "/spending": "AI Spending",
  "/offers": "Offers",
};

// Tier labels from pricing SSOT — matches TIER_NAMES in lib/constants/pricing.ts
const TIER_LABELS: Record<number, string> = {
  1: "Free",
  2: "DIY Seller",
  3: "Power Seller",
  4: "Estate Manager",
};

// Top bar — only the 5 most-used links
const CENTER_LINKS = [
  { href: "/dashboard",  label: "Dashboard", icon: LayoutDashboard },
  { href: "/items",      label: "Items",     icon: Package },
  { href: "/projects",   label: "Sales",     icon: FolderOpen },
  { href: "/messages",   label: "Messages",  icon: MessageSquare },
];

// Full dropdown menu — 6 sections matching the spec
// ═══ AVATAR DROPDOWN — Selling + Action (the money-making stuff) ═══
const DROPDOWN_SECTIONS = [
  {
    id: "stuff",
    heading: "Your Stuff",
    items: [
      { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
      { href: "/items",      label: "My Items",    icon: Package },
      { href: "/projects",   label: "My Sales",    icon: FolderOpen },
      { href: "/store",      label: "My Store",    icon: ShoppingBag },
      { href: "/messages",   label: "Messages",    icon: MessageSquare, badge: "unread" as const },
    ],
  },
  {
    id: "tools",
    heading: "Tools",
    items: [
      { href: "/bots",        label: "AI Bots",         icon: Bot },
      { href: "/marketplace", label: "Add-On Store",    icon: Sparkles },
      { href: "/analytics",   label: "Analytics",       icon: BarChart3 },
      { href: "/spending",    label: "AI Spending",     icon: DollarSign },
      { href: "/shipping",    label: "Shipping Center", icon: Truck },
    ],
  },
];

// ═══ SETTINGS PANEL — Admin + Account (Claude-style settings hub) ═══
const SETTINGS_SECTIONS = [
  {
    id: "account",
    heading: "Account",
    items: [
      { href: "/settings",            label: "Settings",           icon: Settings },
      { href: "/connected-accounts",  label: "Connected Accounts", icon: Link2 },
      { href: "/subscription",        label: "Subscription",       icon: CreditCard },
      { href: "/credits",             label: "Credits",            icon: Coins, badge: "credits" as const },
    ],
  },
  {
    id: "support",
    heading: "Support & Info",
    items: [
      { href: "/help",       label: "Help Center",        icon: HelpCircle },
      { href: "/shortcuts",  label: "Keyboard Shortcuts",  icon: Command, desktopOnly: true },
      { href: "/whats-new",  label: "What's New",          icon: Sparkles },
      { href: "/referral",   label: "Refer & Earn",        icon: Gift },
    ],
  },
];

// Combined for mobile full-screen menu
const MENU_SECTIONS = [...DROPDOWN_SECTIONS, ...SETTINGS_SECTIONS];

/* ── Shared styles ────────────────────────────────────────────────────────── */

const glassPanel = {
  background: "rgba(12, 12, 22, 0.97)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1rem",
  boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.35)",
  backdropFilter: "blur(24px)",
};

const menuItemBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.6rem 1rem",
  fontSize: "0.875rem",
  color: "rgba(255,255,255,0.82)",
  textDecoration: "none",
  transition: "all 0.15s ease",
  borderRadius: "0.5rem",
  margin: "0 0.375rem",
  minHeight: "3rem",
  cursor: "pointer",
  border: "none",
  width: "calc(100% - 0.75rem)",
  textAlign: "left" as const,
  background: "transparent",
};

/* ── Component ────────────────────────────────────────────────────────────── */

export default function AppNav({ user, alertCount = 0, unreadCount = 0, creditBalance = 0 }: Props) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { mode, resolved, setMode } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen,     setBellOpen]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifsLoaded,  setNotifsLoaded]  = useState(false);

  const dropdownRef  = useRef<HTMLDivElement>(null);
  const bellRef      = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeRef     = useRef<HTMLButtonElement>(null);
  const drawerRef    = useRef<HTMLDivElement>(null);

  // Swipe-to-dismiss refs for mobile drawer
  const drawerSwipeStart = useRef(0);
  const drawerSwipeEnd = useRef(0);
  const drawerSwiping = useRef(false);

  const onDrawerTouchStart = useCallback((e: React.TouchEvent) => {
    drawerSwipeStart.current = e.touches[0].clientX;
    drawerSwipeEnd.current = e.touches[0].clientX;
    drawerSwiping.current = true;
  }, []);

  const onDrawerTouchMove = useCallback((e: React.TouchEvent) => {
    if (!drawerSwiping.current) return;
    drawerSwipeEnd.current = e.touches[0].clientX;
  }, []);

  const onDrawerTouchEnd = useCallback(() => {
    if (!drawerSwiping.current) return;
    drawerSwiping.current = false;
    const delta = drawerSwipeEnd.current - drawerSwipeStart.current;
    if (delta > 80) setMobileOpen(false);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      // Close settings panel on outside click (settings button wraps in its own div)
      const settingsEl = document.querySelector('[aria-label="Settings menu"]')?.parentElement;
      if (settingsEl && !settingsEl.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setSettingsOpen(false);
    setBellOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // ESC key to close drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Focus trap: focus close button on open, restore to hamburger on close
  useEffect(() => {
    if (mobileOpen) {
      // Small delay for animation to mount the DOM element
      requestAnimationFrame(() => closeRef.current?.focus());
    } else {
      hamburgerRef.current?.focus();
    }
  }, [mobileOpen]);

  // Tab trap inside drawer
  useEffect(() => {
    if (!mobileOpen || !drawerRef.current) return;
    const panel = drawerRef.current;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onTab);
    return () => window.removeEventListener("keydown", onTab);
  }, [mobileOpen]);

  const cycleTheme = () => { if (mode === "light") setMode("dark"); else if (mode === "dark") setMode("auto"); else setMode("light"); };

  const loadNotifications = async () => {
    if (notifsLoaded) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) { setNotifications((await res.json()).slice(0, 10)); setNotifsLoaded(true); }
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: "all", isRead: true }) });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  };

  const totalNotifications = alertCount + unreadCount;
  const displayName = user?.email?.split("@")[0] ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const tierLabel = TIER_LABELS[user?.tier ?? 0] ?? `Tier ${user?.tier}`;

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/")) || (href === "/items" && pathname.startsWith("/items"));

  // Resolve mobile page title from pathname
  const mobilePageTitle = (() => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    // Check prefix matches (e.g. /items/abc → "My Items", /bots/analyzebot → "AI Bots")
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      const prefix = "/" + segments[0];
      if (PAGE_TITLES[prefix]) return PAGE_TITLES[prefix];
    }
    return "";
  })();

  /* ── Reusable menu item renderer ── */
  const renderMenuItem = (item: { href: string; label: string; icon: any; badge?: string; desktopOnly?: boolean }, mobile = false) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const badgeValue = item.badge === "unread" ? unreadCount : item.badge === "credits" ? creditBalance : 0;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={item.desktopOnly && mobile ? "hidden" : ""}
        style={{
          ...menuItemBase,
          color: active ? "#fff" : "rgba(255,255,255,0.82)",
          background: active ? "rgba(0, 188, 212, 0.1)" : "transparent",
        }}
        onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "#fff"; } }}
        onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.82)"; } }}
      >
        <Icon size={18} style={{ flexShrink: 0, color: active ? TEAL : "rgba(255,255,255,0.35)" }} />
        <span style={{ flex: 1 }}>{item.label}</span>
        {active && <span style={{ width: 3, height: 18, borderRadius: 2, background: TEAL, flexShrink: 0 }} />}
        {item.badge && badgeValue > 0 && (
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", lineHeight: 1.4,
            background: item.badge === "unread" ? "#dc2626" : "rgba(0,188,212,0.15)",
            color: item.badge === "unread" ? "#fff" : TEAL,
          }}>
            {badgeValue}
          </span>
        )}
      </Link>
    );
  };

  /* ── Render ── */
  return (
    <>
      <style>{`
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        paddingTop: "env(safe-area-inset-top, 0px)",
        background: "rgba(10, 10, 18, 0.82)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
      }}>
      {/* Inner row — fixed 64px height, sits below safe-area padding */}
      <div style={{ height: "64px" }}>
        <div className="container-app" style={{ height: "100%", display: "flex", alignItems: "center", gap: "1.25rem" }}>

          {/* LEFT: Logo */}
          <Link href={user ? "/dashboard" : "/"} style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }} aria-label="LegacyLoop home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logos/legacyloop-logo.png"
              alt="LegacyLoop"
              style={{ height: "48px", width: "auto", objectFit: "contain" }}
              className="hidden lg:block"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logos/logo-icon.png"
              alt="LegacyLoop"
              style={{ height: "44px", width: "44px", objectFit: "contain" }}
              className="lg:hidden"
            />
          </Link>

          {/* CENTER: Mobile page title */}
          {mobilePageTitle && (
            <span
              className="lg:hidden"
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: "0.95rem",
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {mobilePageTitle}
            </span>
          )}

          {/* CENTER: Desktop nav (logged-in) */}
          {user && (
            <nav style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "0.125rem" }} className="hidden lg:flex">
              {CENTER_LINKS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} style={{
                    display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 0.9rem",
                    borderRadius: "0.55rem", fontSize: "0.875rem", fontWeight: active ? 600 : 450, letterSpacing: "0.01em",
                    color: active ? "#fff" : "rgba(255,255,255,0.5)",
                    background: active ? "rgba(0, 188, 212, 0.15)" : "transparent",
                    border: `1px solid ${active ? TEAL_BDR : "transparent"}`,
                    boxShadow: active ? `0 2px 0 0 ${TEAL}, 0 4px 12px rgba(0,188,212,0.15)` : "none",
                    transition: "all 0.18s ease", textDecoration: "none", minHeight: "2.75rem",
                  }}
                  onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.82)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; } }}
                  onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLElement).style.background = "transparent"; } }}
                  >
                    <Icon size={15} />
                    {label}
                    {label === "Messages" && unreadCount > 0 && (
                      <span style={{ background: "#dc2626", color: "#fff", fontSize: "0.58rem", fontWeight: 800, padding: "0.1rem 0.35rem", borderRadius: "9999px", lineHeight: 1.4, marginLeft: "1px" }}>
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* CENTER: Logged-out nav */}
          {!user && (
            <nav style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "0.125rem" }} className="hidden lg:flex">
              {[
                { href: "/search", label: "Browse", icon: Search },
                { href: "/heroes", label: "Heroes", icon: Trophy },
                { href: "/pricing", label: "Pricing", icon: null as any },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.8rem",
                  borderRadius: "0.55rem", fontSize: "0.84rem", fontWeight: 450,
                  color: "rgba(255,255,255,0.75)", background: "transparent",
                  transition: "all 0.18s ease", textDecoration: "none",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.82)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {Icon && <Icon size={14} />}
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* RIGHT: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0, marginLeft: "auto" }}>
            {user ? (
              <>
                {/* + New Item */}
                <Link href="/items/new" className="btn-primary hidden sm:inline-flex"
                  style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem", gap: "0.35rem", borderRadius: "0.6rem" }}>
                  <Plus size={14} />
                  <span className="hidden lg:inline">New Item</span>
                  <span className="lg:hidden">New</span>
                </Link>

                {/* Credit balance pill — hidden on mobile to prevent nav overflow */}
                <Link
                  href="/credits"
                  className="hidden lg:flex"
                  style={{
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.3rem 0.65rem",
                    borderRadius: "9999px",
                    background: "rgba(0, 188, 212, 0.1)",
                    border: "1px solid rgba(0, 188, 212, 0.25)",
                    color: TEAL,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0, 188, 212, 0.18)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0, 188, 212, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0, 188, 212, 0.1)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0, 188, 212, 0.25)";
                  }}
                  title="Your credit balance"
                >
                  <span style={{ fontSize: "0.72rem" }}>💎</span>
                  {creditBalance}
                </Link>

                {/* (Settings + Help icons moved to settings panel) */}

                {/* Notifications bell */}
                <div ref={bellRef} style={{ position: "relative" }}>
                  <button onClick={() => { setBellOpen((v) => !v); if (!bellOpen) loadNotifications(); }}
                    style={{
                      position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                      width: "2.75rem", height: "2.75rem", borderRadius: "0.55rem",
                      background: bellOpen ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${bellOpen ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.09)"}`,
                      color: totalNotifications > 0 ? TEAL : "rgba(255,255,255,0.7)",
                      transition: "all 0.15s ease", cursor: "pointer",
                    }}
                    aria-label="Notifications" aria-expanded={bellOpen}>
                    <Bell size={16} />
                    {totalNotifications > 0 && (
                      <span style={{
                        position: "absolute", top: "-4px", right: "-4px",
                        background: "#dc2626", color: "#fff", fontSize: "0.58rem", fontWeight: 800,
                        padding: "0.1rem 0.3rem", borderRadius: "9999px", lineHeight: 1.4, minWidth: "1rem", textAlign: "center",
                      }}>
                        {totalNotifications > 99 ? "99+" : totalNotifications}
                      </span>
                    )}
                  </button>

                  {/* Bell dropdown */}
                  {bellOpen && (
                    <div style={{ ...glassPanel, position: "absolute", top: "calc(100% + 0.5rem)", right: 0, width: "min(22rem, 92vw)", maxHeight: "26rem", overflowY: "auto", zIndex: 100 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem 0.625rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>Notifications</span>
                        {notifications.some((n) => !n.isRead) && (
                          <button onClick={markAllRead} style={{ fontSize: "0.72rem", color: TEAL, background: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}>
                            Mark all read
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div style={{ padding: "2rem 1rem", textAlign: "center", fontSize: "0.85rem", color: "rgba(255,255,255,0.3)" }}>
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link key={n.id} href={n.link ?? "/dashboard"} style={{
                            display: "block", padding: "0.7rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.04)",
                            background: n.isRead ? "transparent" : "rgba(0,188,212,0.03)", textDecoration: "none", transition: "background 0.12s ease",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.isRead ? "transparent" : "rgba(0,188,212,0.03)"; }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: n.isRead ? 400 : 600, color: "#fff", lineHeight: 1.35 }}>
                              {!n.isRead && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: TEAL, marginRight: "0.5rem", verticalAlign: "middle" }} />}
                              {n.title}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", marginTop: "0.2rem" }}>{n.message}</div>
                            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", marginTop: "0.15rem" }}>
                              {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile settings gear — visible <1024px only */}
                <Link
                  href="/settings"
                  className="flex lg:hidden"
                  style={{
                    alignItems: "center", justifyContent: "center",
                    width: "2.75rem", height: "2.75rem", borderRadius: "0.55rem",
                    background: isActive("/settings") ? "rgba(0,188,212,0.12)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${isActive("/settings") ? "rgba(0,188,212,0.3)" : "rgba(255,255,255,0.09)"}`,
                    color: isActive("/settings") ? TEAL : "rgba(255,255,255,0.7)",
                    transition: "all 0.15s ease", flexShrink: 0,
                  }}
                  aria-label="Settings"
                >
                  <Settings size={16} />
                </Link>

                {/* User avatar dropdown */}
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button onClick={() => { setDropdownOpen((v) => !v); setSettingsOpen(false); }} style={{
                    display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.35rem 0.55rem",
                    borderRadius: "0.6rem",
                    background: dropdownOpen ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${dropdownOpen ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.09)"}`,
                    color: "#fff", cursor: "pointer", transition: "all 0.15s ease",
                  }} aria-label="User menu" aria-expanded={dropdownOpen}>
                    <div style={{
                      width: "1.75rem", height: "1.75rem", borderRadius: "50%",
                      background: `linear-gradient(135deg, ${TEAL}, #0097a7)`, color: "#fff",
                      fontSize: "0.68rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, boxShadow: `0 0 10px ${TEAL_GLOW}`,
                    }}>
                      {initials}
                    </div>
                    {user.heroVerified && (
                      <span title="Hero Verified" style={{ fontSize: "0.7rem", marginLeft: "-0.2rem" }}>{"\uD83D\uDEE1\uFE0F"}</span>
                    )}
                    <span className="hidden sm:inline" style={{
                      fontSize: "0.8rem", fontWeight: 500, maxWidth: "6rem", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(255,255,255,0.8)",
                    }}>
                      {displayName}
                    </span>
                    <ChevronDown size={13} style={{
                      color: "rgba(255,255,255,0.4)", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease", flexShrink: 0,
                    }} />
                  </button>

                  {/* Desktop dropdown menu */}
                  {dropdownOpen && (
                    <div style={{ ...glassPanel, position: "absolute", top: "calc(100% + 0.5rem)", right: 0, width: "16rem", maxHeight: "calc(100vh - 80px)", overflowY: "auto", zIndex: 100 }}>
                      {/* Identity header */}
                      <div style={{ padding: "1rem 1rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div style={{
                            width: "2.25rem", height: "2.25rem", borderRadius: "50%",
                            background: `linear-gradient(135deg, ${TEAL}, #0097a7)`, color: "#fff",
                            fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, boxShadow: `0 0 10px ${TEAL_GLOW}`,
                          }}>{initials}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#fff" }}>{displayName}</div>
                            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{
                            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                            padding: "0.2rem 0.55rem", borderRadius: "0.35rem",
                            background: "rgba(0,188,212,0.12)", color: TEAL, border: "1px solid rgba(0,188,212,0.2)",
                          }}>{tierLabel} Plan</span>
                          <Link href="/profile" style={{ fontSize: "0.7rem", color: TEAL, textDecoration: "none" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}>
                            View Profile
                          </Link>
                        </div>
                      </div>

                      {/* Selling sections only */}
                      {DROPDOWN_SECTIONS.map((section) => (
                        <div key={section.id} style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{
                            padding: "0.35rem 1rem 0.25rem", fontSize: "0.6rem", fontWeight: 700,
                            letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
                          }}>{section.heading}</div>
                          {section.items.map((item) => renderMenuItem(item))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settings panel button — desktop only (hamburger replaces on mobile) */}
                <div className="hidden lg:block" style={{ position: "relative" }}>
                  <button onClick={() => { setSettingsOpen((v) => !v); setDropdownOpen(false); }} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "2.75rem", height: "2.75rem", borderRadius: "0.55rem",
                    background: settingsOpen ? "rgba(0,188,212,0.12)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${settingsOpen ? "rgba(0,188,212,0.3)" : "rgba(255,255,255,0.09)"}`,
                    color: settingsOpen ? TEAL : "rgba(255,255,255,0.7)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = settingsOpen ? "rgba(0,188,212,0.12)" : "rgba(255,255,255,0.06)"; }}
                  aria-label="Settings menu">
                    <Settings size={16} />
                  </button>

                  {/* Settings Panel — Claude-style admin menu */}
                  {settingsOpen && (
                    <div style={{ ...glassPanel, position: "absolute", top: "calc(100% + 0.5rem)", right: 0, width: "16rem", maxHeight: "calc(100vh - 80px)", overflowY: "auto", zIndex: 200 }}>
                      <div style={{ padding: "0.75rem 0.75rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>{user.email}</div>
                      </div>

                      {SETTINGS_SECTIONS.map((section) => (
                        <div key={section.id} style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ padding: "0.35rem 1rem 0.25rem", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
                            {section.heading}
                          </div>
                          {section.items.map((item) => renderMenuItem(item))}
                        </div>
                      ))}

                      {/* Session — Theme + Sign Out */}
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "0.375rem 0" }}>
                        {/* Theme Picker — Light / Dark / Auto */}
                        <div style={{ display: "flex", gap: "2px", padding: "0.25rem", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", margin: "0.25rem 0.5rem" }}>
                          {([{ m: "light" as const, icon: <Sun size={14} />, label: "Light" }, { m: "dark" as const, icon: <Moon size={14} />, label: "Dark" }, { m: "auto" as const, icon: <Monitor size={14} />, label: "Auto" }]).map((opt) => (
                            <button key={opt.m} onClick={() => setMode(opt.m)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "0.4rem 0.5rem", borderRadius: "8px", border: "none", background: mode === opt.m ? "rgba(0,188,212,0.15)" : "transparent", color: mode === opt.m ? "#00bcd4" : "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: mode === opt.m ? 700 : 500, cursor: "pointer", transition: "all 0.15s ease" }}>{opt.icon}{opt.label}</button>
                          ))}
                        </div>
                        <button onClick={handleLogout} style={{ ...menuItemBase, color: "rgba(248, 113, 113, 0.75)", width: "100%" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(220, 38, 38, 0.08)"; (e.currentTarget as HTMLElement).style.color = "#fca5a5"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(248, 113, 113, 0.75)"; }}>
                          <LogOut size={18} style={{ flexShrink: 0 }} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CMD-MOBILE-8C: Hamburger menu for logged-in mobile users.
                    Replaces settings gear on mobile (lg:hidden). Triggers the
                    existing full-screen mobileOpen overlay at line 634 which
                    already renders ALL nav sections for logged-in users. */}
                <button
                  ref={hamburgerRef}
                  className="flex lg:hidden"
                  onClick={() => { setMobileOpen((v) => !v); setDropdownOpen(false); setSettingsOpen(false); setBellOpen(false); }}
                  style={{
                    alignItems: "center", justifyContent: "center",
                    width: "2.75rem", height: "2.75rem", borderRadius: "0.55rem",
                    background: mobileOpen ? "rgba(0,188,212,0.12)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${mobileOpen ? "rgba(0,188,212,0.3)" : "rgba(255,255,255,0.09)"}`,
                    color: mobileOpen ? TEAL : "rgba(255,255,255,0.7)",
                    cursor: "pointer", transition: "all 0.15s ease", padding: 0,
                  }}
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <X size={18} /> : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:inline-flex" style={{
                  padding: "0.45rem 0.875rem", fontSize: "0.84rem", borderRadius: "0.6rem",
                  fontWeight: 600, textDecoration: "none",
                  border: `2px solid ${TEAL}`, color: TEAL,
                  background: "rgba(0, 188, 212, 0.08)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0, 188, 212, 0.18)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0, 188, 212, 0.08)"; }}
                >Log In</Link>
                <Link href="/auth/signup" className="btn-primary hidden sm:inline-flex" style={{ padding: "0.45rem 0.875rem", fontSize: "0.84rem", borderRadius: "0.6rem" }}>Get Started</Link>

                {/* Mobile hamburger (logged-out) */}
                <button className="flex lg:hidden" onClick={() => setMobileOpen((v) => !v)} style={{
                  alignItems: "center", justifyContent: "center",
                  width: "2.75rem", height: "2.75rem", borderRadius: "0.55rem",
                  background: mobileOpen ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${mobileOpen ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.09)"}`,
                  color: "rgba(255,255,255,0.85)", cursor: "pointer", transition: "all 0.15s ease",
                }} aria-label="Toggle mobile menu">
                  {mobileOpen ? <X size={16} /> : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      </header>

      {/* ── Mobile slide-in drawer (logged-in) ── */}
      {user && mobileOpen && (
        <>
          {/* Backdrop overlay — tap to close */}
          <div
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
            style={{
              position: "fixed", inset: 0, zIndex: 998,
              background: "rgba(0,0,0,0.5)",
              animation: "backdropFadeIn 0.2s ease forwards",
            }}
          />

          {/* Drawer panel */}
          <div
            ref={drawerRef}
            className="lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            onTouchStart={onDrawerTouchStart}
            onTouchMove={onDrawerTouchMove}
            onTouchEnd={onDrawerTouchEnd}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "min(320px, 88vw)",
              background: "#0D1117",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
              zIndex: 999,
              overflowY: "auto",
              paddingBottom: "env(safe-area-inset-bottom)",
              animation: "drawerSlideIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards",
            }}
          >
            {/* ── Section 1: Header ── */}
            <div style={{ paddingTop: "env(safe-area-inset-top, 0px)", padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Close button — top right */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem", paddingTop: "env(safe-area-inset-top, 0px)" }}>
                <button
                  ref={closeRef}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    width: "44px", height: "44px", borderRadius: "0.6rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "transparent", border: "none",
                    color: "rgba(255,255,255,0.7)", cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>

              {/* User identity */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  background: `linear-gradient(135deg, ${TEAL}, #0097a7)`, color: "#fff",
                  fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, boxShadow: `0 0 14px ${TEAL_GLOW}`,
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "#fff" }}>{displayName}</div>
                  <span style={{
                    display: "inline-block", marginTop: "4px",
                    fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "0.2rem 0.55rem", borderRadius: "0.35rem",
                    background: "rgba(0,188,212,0.12)", color: TEAL, border: "1px solid rgba(0,188,212,0.2)",
                  }}>
                    {tierLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Section 2: Main Navigation ── */}
            <div style={{ padding: "0.5rem 0.625rem" }}>
              {[
                { href: "/dashboard",  label: "Dashboard", icon: LayoutDashboard },
                { href: "/items",      label: "My Items",  icon: Package },
                { href: "/projects",   label: "My Sales",  icon: FolderOpen },
                { href: "/store",      label: "My Store",  icon: ShoppingBag },
                { href: "/messages",   label: "Messages",  icon: MessageSquare, badge: true },
              ].map(({ href, label, icon: Icon, badge }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0 1rem", minHeight: "52px",
                    borderRadius: "0.6rem", textDecoration: "none",
                    color: active ? "#fff" : "rgba(255,255,255,0.75)",
                    background: active ? "rgba(0,188,212,0.1)" : "transparent",
                    transition: "all 0.15s ease",
                    fontSize: "1rem", fontWeight: active ? 600 : 450,
                    fontFamily: "var(--font-body)",
                  }}>
                    <Icon size={20} style={{ flexShrink: 0, color: active ? TEAL : "rgba(255,255,255,0.35)" }} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {active && <span style={{ width: 3, height: 20, borderRadius: 2, background: TEAL, flexShrink: 0 }} />}
                    {badge && unreadCount > 0 && (
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem",
                        borderRadius: "9999px", lineHeight: 1.4,
                        background: "#dc2626", color: "#fff",
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.25rem 1.25rem" }} />

            {/* ── Section 3: Tools ── */}
            <div style={{ padding: "0.5rem 0.625rem" }}>
              {[
                { href: "/bots",        label: "AI Bots",         icon: Bot },
                { href: "/shipping",    label: "Shipping Center", icon: Truck },
                { href: "/analytics",   label: "Analytics",       icon: BarChart3 },
                { href: "/marketplace", label: "Add-On Store",    icon: Sparkles },
              ].map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0 1rem", minHeight: "52px",
                    borderRadius: "0.6rem", textDecoration: "none",
                    color: active ? "#fff" : "rgba(255,255,255,0.75)",
                    background: active ? "rgba(0,188,212,0.1)" : "transparent",
                    transition: "all 0.15s ease",
                    fontSize: "1rem", fontWeight: active ? 600 : 450,
                    fontFamily: "var(--font-body)",
                  }}>
                    <Icon size={20} style={{ flexShrink: 0, color: active ? TEAL : "rgba(255,255,255,0.35)" }} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {active && <span style={{ width: 3, height: 20, borderRadius: 2, background: TEAL, flexShrink: 0 }} />}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.25rem 1.25rem" }} />

            {/* ── Section 4: Account ── */}
            <div style={{ padding: "0.5rem 0.625rem" }}>
              {[
                { href: "/settings",     label: "Settings",     icon: Settings },
                { href: "/subscription", label: "Subscription", icon: CreditCard },
              ].map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0 1rem", minHeight: "52px",
                    borderRadius: "0.6rem", textDecoration: "none",
                    color: active ? "#fff" : "rgba(255,255,255,0.75)",
                    background: active ? "rgba(0,188,212,0.1)" : "transparent",
                    transition: "all 0.15s ease",
                    fontSize: "1rem", fontWeight: active ? 600 : 450,
                    fontFamily: "var(--font-body)",
                  }}>
                    <Icon size={20} style={{ flexShrink: 0, color: active ? TEAL : "rgba(255,255,255,0.35)" }} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {active && <span style={{ width: 3, height: 20, borderRadius: 2, background: TEAL, flexShrink: 0 }} />}
                  </Link>
                );
              })}

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  padding: "0 1rem", minHeight: "52px", width: "100%",
                  borderRadius: "0.6rem", border: "none", cursor: "pointer",
                  color: "#ef4444", background: "transparent",
                  transition: "all 0.15s ease",
                  fontSize: "1rem", fontWeight: 450,
                  fontFamily: "var(--font-body)",
                  textAlign: "left",
                }}
              >
                <LogOut size={20} style={{ flexShrink: 0 }} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Mobile slide-in drawer (logged-out) ── */}
      {!user && mobileOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
            style={{
              position: "fixed", inset: 0, zIndex: 998,
              background: "rgba(0,0,0,0.5)",
              animation: "backdropFadeIn 0.2s ease forwards",
            }}
          />

          {/* Drawer panel */}
          <div
            className="lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onTouchStart={onDrawerTouchStart}
            onTouchMove={onDrawerTouchMove}
            onTouchEnd={onDrawerTouchEnd}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "min(320px, 88vw)",
              background: "#0D1117",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
              zIndex: 999,
              overflowY: "auto",
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom)",
              animation: "drawerSlideIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards",
            }}
          >
            {/* Close button */}
            <div style={{ padding: "1.25rem 1.25rem 0.75rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  width: "44px", height: "44px", borderRadius: "0.6rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "transparent", border: "none",
                  color: "rgba(255,255,255,0.7)", cursor: "pointer",
                }}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Nav links */}
            <div style={{ padding: "0.5rem 0.625rem" }}>
              {[
                { href: "/search", label: "Browse", icon: Search },
                { href: "/heroes", label: "Heroes", icon: Trophy },
                { href: "/pricing", label: "Pricing", icon: CreditCard },
              ].map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0 1rem", minHeight: "52px",
                    borderRadius: "0.6rem", textDecoration: "none",
                    color: active ? "#fff" : "rgba(255,255,255,0.75)",
                    background: active ? "rgba(0,188,212,0.1)" : "transparent",
                    transition: "all 0.15s ease",
                    fontSize: "1rem", fontWeight: active ? 600 : 450,
                    fontFamily: "var(--font-body)",
                  }}>
                    <Icon size={20} style={{ flexShrink: 0, color: active ? TEAL : "rgba(255,255,255,0.35)" }} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {active && <span style={{ width: 3, height: 20, borderRadius: 2, background: TEAL, flexShrink: 0 }} />}
                  </Link>
                );
              })}
            </div>

            {/* Auth CTAs */}
            <div style={{ padding: "1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link href="/auth/login" style={{
                width: "100%", justifyContent: "center", borderRadius: "0.75rem",
                padding: "0.85rem 1rem", fontSize: "0.95rem", textAlign: "center", display: "flex",
                fontWeight: 600, textDecoration: "none",
                border: `2px solid ${TEAL}`, color: TEAL,
                background: "rgba(0, 188, 212, 0.08)",
              }}>
                Log In
              </Link>
              <Link href="/auth/signup" className="btn-primary" style={{
                width: "100%", justifyContent: "center", borderRadius: "0.75rem",
                padding: "0.85rem 1rem", fontSize: "0.95rem", textAlign: "center", display: "flex",
              }}>
                Get Started
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
