"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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

/* ── Shared styles ────────────────────────────────────────────────────────── */

const menuItemBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.6rem 1rem",
  fontSize: "0.875rem",
  color: "var(--text-primary)",
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifsLoaded,  setNotifsLoaded]  = useState(false);

  const dropdownRef  = useRef<HTMLDivElement>(null);
  const bellRef      = useRef<HTMLDivElement>(null);

  // Scroll state for glass-nav-scrolled
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      const settingsEl = document.querySelector('[aria-label="Settings menu"]')?.parentElement;
      if (settingsEl && !settingsEl.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => {
    setDropdownOpen(false);
    setSettingsOpen(false);
    setBellOpen(false);
  }, [pathname]);

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
    setSettingsOpen(false);
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
          color: active ? "var(--text-primary)" : "var(--text-secondary)",
          background: active ? "rgba(0, 188, 212, 0.1)" : "transparent",
        }}
        onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "var(--ghost-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; } }}
        onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; } }}
      >
        <Icon size={18} style={{ flexShrink: 0, color: active ? TEAL : "var(--text-muted)" }} />
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
      <header className={`glass-nav${scrolled ? " glass-nav-scrolled" : ""}`} style={{
        position: "sticky", top: 0, zIndex: 50,
        paddingTop: "env(safe-area-inset-top, 0px)",
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
                    color: active ? "var(--text-primary)" : "var(--text-muted)",
                    background: active ? "rgba(0, 188, 212, 0.15)" : "transparent",
                    border: `1px solid ${active ? TEAL_BDR : "transparent"}`,
                    boxShadow: active ? `0 2px 0 0 ${TEAL}, 0 4px 12px rgba(0,188,212,0.15)` : "none",
                    transition: "all 0.18s ease", textDecoration: "none", minHeight: "2.75rem",
                  }}
                  onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; (e.currentTarget as HTMLElement).style.background = "var(--ghost-bg)"; } }}
                  onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; } }}
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
                  color: "var(--text-secondary)", background: "transparent",
                  transition: "all 0.18s ease", textDecoration: "none",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; (e.currentTarget as HTMLElement).style.background = "var(--ghost-bg)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
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
                      background: bellOpen ? "var(--ghost-hover-bg)" : "var(--ghost-bg)",
                      border: `1px solid ${bellOpen ? "var(--ghost-border)" : "var(--border-default)"}`,
                      color: totalNotifications > 0 ? TEAL : "var(--text-secondary)",
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
                    <div className="glass-modal" style={{ position: "absolute", top: "calc(100% + 0.5rem)", right: 0, width: "min(22rem, 92vw)", maxHeight: "26rem", overflowY: "auto", zIndex: 100 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem 0.625rem", borderBottom: "1px solid var(--glass-border)" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>Notifications</span>
                        {notifications.some((n) => !n.isRead) && (
                          <button onClick={markAllRead} style={{ fontSize: "0.72rem", color: TEAL, background: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}>
                            Mark all read
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div style={{ padding: "2rem 1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link key={n.id} href={n.link ?? "/dashboard"} style={{
                            display: "block", padding: "0.7rem 1rem", borderBottom: "1px solid var(--glass-border)",
                            background: n.isRead ? "transparent" : "rgba(0,188,212,0.03)", textDecoration: "none", transition: "background 0.12s ease",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--ghost-bg)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.isRead ? "transparent" : "rgba(0,188,212,0.03)"; }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: n.isRead ? 400 : 600, color: "var(--text-primary)", lineHeight: 1.35 }}>
                              {!n.isRead && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: TEAL, marginRight: "0.5rem", verticalAlign: "middle" }} />}
                              {n.title}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>{n.message}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                              {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* User avatar dropdown */}
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button onClick={() => { setDropdownOpen((v) => !v); setSettingsOpen(false); }} style={{
                    display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.35rem 0.55rem",
                    borderRadius: "0.6rem",
                    background: dropdownOpen ? "var(--ghost-bg)" : "var(--ghost-bg)",
                    border: `1px solid ${dropdownOpen ? "var(--ghost-border)" : "var(--border-default)"}`,
                    color: "var(--text-primary)", cursor: "pointer", transition: "all 0.15s ease",
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
                      textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-secondary)",
                    }}>
                      {displayName}
                    </span>
                    <ChevronDown size={13} style={{
                      color: "var(--text-muted)", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease", flexShrink: 0,
                    }} />
                  </button>

                  {/* Desktop dropdown menu */}
                  {dropdownOpen && (
                    <div className="glass-modal" style={{ position: "absolute", top: "calc(100% + 0.5rem)", right: 0, width: "16rem", maxHeight: "calc(100vh - 80px)", overflowY: "auto", zIndex: 100 }}>
                      {/* Identity header */}
                      <div style={{ padding: "1rem 1rem 0.75rem", borderBottom: "1px solid var(--glass-border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div style={{
                            width: "2.25rem", height: "2.25rem", borderRadius: "50%",
                            background: `linear-gradient(135deg, ${TEAL}, #0097a7)`, color: "#fff",
                            fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, boxShadow: `0 0 10px ${TEAL_GLOW}`,
                          }}>{initials}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{displayName}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
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
                        <div key={section.id} style={{ padding: "0.375rem 0", borderBottom: "1px solid var(--glass-border)" }}>
                          <div style={{
                            padding: "0.35rem 1rem 0.25rem", fontSize: "0.6rem", fontWeight: 700,
                            letterSpacing: "0.14em", color: "var(--text-muted)", textTransform: "uppercase",
                          }}>{section.heading}</div>
                          {section.items.map((item) => renderMenuItem(item))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settings panel button — visible all viewports */}
                <div style={{ position: "relative" }}>
                  <button onClick={() => { setSettingsOpen((v) => !v); setDropdownOpen(false); setBellOpen(false); }} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "2.75rem", height: "2.75rem", borderRadius: "0.55rem",
                    background: settingsOpen ? "rgba(0,188,212,0.12)" : "var(--ghost-bg)",
                    border: `1px solid ${settingsOpen ? "rgba(0,188,212,0.3)" : "var(--border-default)"}`,
                    color: settingsOpen ? TEAL : "var(--text-secondary)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--ghost-hover-bg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = settingsOpen ? "rgba(0,188,212,0.12)" : "var(--ghost-bg)"; }}
                  aria-label="Settings menu" aria-expanded={settingsOpen}>
                    <Settings size={16} />
                  </button>

                  {/* Settings Panel — unified for all viewports */}
                  {settingsOpen && (
                    <div className="glass-modal" style={{ position: "absolute", top: "calc(100% + 0.5rem)", right: 0, width: "min(16rem, 90vw)", maxHeight: "calc(100vh - 80px)", overflowY: "auto", zIndex: 200 }}>
                      <div style={{ padding: "0.75rem 0.75rem 0.5rem", borderBottom: "1px solid var(--glass-border)" }}>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{user.email}</div>
                      </div>

                      {SETTINGS_SECTIONS.map((section) => (
                        <div key={section.id} style={{ padding: "0.375rem 0", borderBottom: "1px solid var(--glass-border)" }}>
                          <div style={{ padding: "0.35rem 1rem 0.25rem", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                            {section.heading}
                          </div>
                          {section.items.map((item) => renderMenuItem(item))}
                        </div>
                      ))}

                      {/* Session — Theme + Sign Out */}
                      <div style={{ borderTop: "1px solid var(--glass-border)", padding: "0.375rem 0" }}>
                        {/* Theme Picker — Light / Dark / Auto */}
                        <div style={{ display: "flex", gap: "2px", padding: "0.25rem", borderRadius: "10px", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", margin: "0.25rem 0.5rem" }}>
                          {([{ m: "light" as const, icon: <Sun size={14} />, label: "Light" }, { m: "dark" as const, icon: <Moon size={14} />, label: "Dark" }, { m: "auto" as const, icon: <Monitor size={14} />, label: "Auto" }]).map((opt) => (
                            <button key={opt.m} onClick={() => setMode(opt.m)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "0.4rem 0.5rem", borderRadius: "8px", border: "none", background: mode === opt.m ? "rgba(0,188,212,0.15)" : "transparent", color: mode === opt.m ? "#00bcd4" : "var(--text-muted)", fontSize: "0.72rem", fontWeight: mode === opt.m ? 700 : 500, cursor: "pointer", transition: "all 0.15s ease" }}>{opt.icon}{opt.label}</button>
                          ))}
                        </div>
                        <button onClick={handleLogout} style={{ ...menuItemBase, color: "var(--error-text)", width: "100%" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--error-bg)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                          <LogOut size={18} style={{ flexShrink: 0 }} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "0.45rem 0.875rem", fontSize: "0.84rem", borderRadius: "0.6rem",
                  fontWeight: 600, textDecoration: "none", minHeight: "44px",
                  border: `2px solid ${TEAL}`, color: TEAL,
                  background: "rgba(0, 188, 212, 0.08)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0, 188, 212, 0.18)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0, 188, 212, 0.08)"; }}
                >Log In</Link>
                <Link href="/auth/signup" className="btn-primary" style={{ padding: "0.45rem 0.875rem", fontSize: "0.84rem", borderRadius: "0.6rem", minHeight: "44px" }}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
      </header>
    </>
  );
}
