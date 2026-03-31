import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home · LegacyLoop",
  description: "Your personalized LegacyLoop welcome dashboard",
};

export default async function HomePage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const [itemCount, analyzedCount, listedCount, soldCount, messageCount, creditBalance, recentActivity] = await Promise.all([
    prisma.item.count({ where: { userId: user.id } }).catch(() => 0),
    prisma.item.count({ where: { userId: user.id, status: { not: "DRAFT" } } }).catch(() => 0),
    prisma.item.count({ where: { userId: user.id, status: { in: ["LISTED", "INTERESTED"] } } }).catch(() => 0),
    prisma.item.count({ where: { userId: user.id, status: { in: ["SOLD", "SHIPPED", "COMPLETED"] } } }).catch(() => 0),
    prisma.conversation.count({ where: { item: { userId: user.id } } }).catch(() => 0),
    prisma.userCredits.findUnique({ where: { userId: user.id }, select: { balance: true } }).then(r => r?.balance ?? 0).catch(() => 0),
    prisma.eventLog.findMany({ where: { item: { userId: user.id } }, orderBy: { createdAt: "desc" }, take: 5, select: { eventType: true, itemId: true, createdAt: true, payload: true } }).catch(() => [] as Array<{ eventType: string; itemId: string; createdAt: Date; payload: string | null }>),
  ]);

  // Draft count for suggestions
  const draftCount = await prisma.item.count({ where: { userId: user.id, status: "DRAFT" } }).catch(() => 0);
  const interestedCount = await prisma.item.count({ where: { userId: user.id, status: "INTERESTED" } }).catch(() => 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = user.email?.split("@")[0] || "there";

  const stats = [
    { label: "Items", value: itemCount, color: "#00bcd4", icon: "📦" },
    { label: "Analyzed", value: analyzedCount, color: "#22c55e", icon: "🧠" },
    { label: "Listed", value: listedCount, color: "#f59e0b", icon: "📋" },
    { label: "Sold", value: soldCount, color: "#8b5cf6", icon: "💰" },
  ];

  const quickActions = [
    { label: "+ New Item", href: "/items/new", color: "#00bcd4" },
    { label: "Dashboard", href: "/dashboard", color: "#00bcd4" },
    { label: "Messages", href: "/messages", color: "#e91e63" },
    { label: "AI Bots", href: "/bots", color: "#8b5cf6" },
    { label: "Shipping", href: "/shipping", color: "#9c27b0" },
    { label: "My Store", href: "/store", color: "#22c55e" },
  ];

  const suggestions: string[] = [];
  if (itemCount === 0) suggestions.push("Welcome to LegacyLoop! Add your first item to get started.");
  if (draftCount > 0) suggestions.push(`You have ${draftCount} item${draftCount > 1 ? "s" : ""} in DRAFT — run AI analysis to unlock pricing.`);
  if (interestedCount > 0) suggestions.push(`${interestedCount} item${interestedCount > 1 ? "s" : ""} have buyer interest — check your messages.`);
  if (creditBalance < 5 && itemCount > 0) suggestions.push("Running low on credits — top up for uninterrupted AI access.");

  function formatEventType(t: string): string {
    return t.replace(/_/g, " ").replace(/RESULT|RUN/g, "").trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  function timeAgo(date: Date): string {
    const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
    return `${Math.round(mins / 1440)}d ago`;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Greeting */}
      <div style={{ textAlign: "center", marginBottom: "2rem", position: "relative" }}>
        <div style={{ position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)", width: "350px", height: "200px", background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,188,212,0.08), transparent 70%)", pointerEvents: "none" }} />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", backgroundImage: "linear-gradient(135deg, var(--text-primary), #00bcd4)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {greeting}, {displayName} 👋
        </h1>
        <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>Here&apos;s your LegacyLoop at a glance</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)", borderRadius: "14px", padding: "1rem", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>{s.icon}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Credit balance */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <Link href="/credits" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 1rem", borderRadius: "9999px", background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.2)", color: "#00bcd4", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}>
          💎 {creditBalance} credits
        </Link>
      </div>

      {/* Quick Actions */}
      <div style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "1.25rem", marginBottom: "1.25rem", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>🎯 Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.5rem" }}>
          {quickActions.map(a => (
            <Link key={a.label} href={a.href} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.65rem 0.5rem", borderRadius: "10px", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-primary)", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", minHeight: "44px", transition: "all 0.2s ease" }}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "1.25rem", marginBottom: "1.25rem", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>📊 Recent Activity</div>
          {recentActivity.map((ev, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border-default)" : "none" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{formatEventType(ev.eventType)}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{timeAgo(ev.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, rgba(0,188,212,0.06), rgba(0,188,212,0.02))", border: "1px solid rgba(0,188,212,0.15)", borderRadius: "16px", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>💡 Suggestions</div>
          {suggestions.map((s, i) => (
            <div key={i} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", padding: "0.35rem 0", lineHeight: 1.5, display: "flex", gap: "0.5rem" }}>
              <span style={{ color: "#00bcd4", flexShrink: 0 }}>→</span> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
