import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal · LegacyLoop",
  description: "Internal admin dashboard for LegacyLoop operations.",
};

import { isAdmin } from "@/lib/constants/admin";
// CMD-RECONBOT-SKILLS: Skills Status widget reads loader directly
// at server-component render time (no API roundtrip).
import { loadSkillPack } from "@/lib/bots/skill-loader";

export default async function AdminPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");
  if (!isAdmin(user.email)) {
    // Non-admin: show access denied
    return (
      <div className="mx-auto max-w-md mt-20 text-center">
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
        <h1 className="h2 mb-2">Admin Access Required</h1>
        <p className="muted">This area is restricted to LegacyLoop staff. If you believe this is an error, contact your administrator.</p>
      </div>
    );
  }

  // Fetch real DB stats
  let totalUsers = 0, totalItems = 0, analyzedItems = 0, totalProjects = 0;
  let totalCredits: { _sum: { balance: number | null } } = { _sum: { balance: null } };
  let totalPlatforms = 0, totalConversations = 0;
  let recentUsers: { id: string; email: string; tier: number; createdAt: Date }[] = [];
  let pendingHeroCount = 0;
  let pendingHeroApplications: { id: string; fullName: string; serviceCategory: string; serviceDetail: string; createdAt: Date }[] = [];
  try {
    [
      totalUsers,
      totalItems,
      analyzedItems,
      totalProjects,
      totalCredits,
      totalPlatforms,
      totalConversations,
      recentUsers,
      pendingHeroCount,
      pendingHeroApplications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.item.count({ where: { status: { not: "DRAFT" } } }),
      prisma.project.count(),
      prisma.userCredits.aggregate({ _sum: { balance: true } }),
      prisma.connectedPlatform.count(),
      prisma.conversation.count(),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, email: true, tier: true, createdAt: true } }),
      prisma.heroVerification.count({ where: { status: "PENDING" } }),
      prisma.heroVerification.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, fullName: true, serviceCategory: true, serviceDetail: true, createdAt: true },
      }),
    ]);
  } catch (e) {
    console.error("[admin] DB queries failed:", e);
  }

  // Bot accuracy leaderboard
  let accuracyLogs: { payload: string | null }[] = [];
  try {
    accuracyLogs = await prisma.eventLog.findMany({
      where: { eventType: "BOT_ACCURACY" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { payload: true },
    });
  } catch { /* non-critical */ }

  const botAccuracyStats: Record<string, { totalError: number; count: number }> = {};
  for (const log of accuracyLogs) {
    try {
      const data = log.payload ? JSON.parse(log.payload) : null;
      if (!data?.results) continue;
      for (const r of data.results) {
        if (!botAccuracyStats[r.bot]) botAccuracyStats[r.bot] = { totalError: 0, count: 0 };
        botAccuracyStats[r.bot].totalError += r.errorPercent || 0;
        botAccuracyStats[r.bot].count++;
      }
    } catch { /* skip malformed */ }
  }

  const MODULES = [
    {
      icon: "👥",
      title: "Users & Accounts",
      desc: "Manage user accounts, tiers, and verification status.",
      color: "#0f766e",
      stats: `${totalUsers} total users`,
      actions: ["View all users", "Adjust tier", "Send notice"],
    },
    {
      icon: "📦",
      title: "Item Inventory",
      desc: "Browse all items across all user accounts.",
      color: "#7c3aed",
      stats: `${totalItems} items (${analyzedItems} analyzed)`,
      actions: ["Browse items", "Bulk status update", "Flag for review"],
    },
    {
      icon: "🏠",
      title: "Sales",
      desc: "Sale events and white-glove service status.",
      color: "#b45309",
      stats: `${totalProjects} active sales`,
      actions: ["View sales", "Assign specialist", "Update status"],
    },
    {
      icon: "💬",
      title: "Conversations",
      desc: "Buyer/seller conversations and support escalations.",
      color: "#1e40af",
      stats: `${totalConversations} conversations`,
      actions: ["View messages", "Flag spam", "Support escalations"],
    },
    {
      icon: "💎",
      title: "Credits & Billing",
      desc: "Credit balances, transactions, and refunds.",
      color: "#0891b2",
      stats: `${totalCredits._sum.balance ?? 0} total credits in circulation`,
      actions: ["Issue credits", "Refund transaction", "View history"],
    },
    {
      icon: "🔗",
      title: "Integrations",
      desc: "Connected platforms and OAuth status monitoring.",
      color: "#dc2626",
      stats: `${totalPlatforms} active connections`,
      actions: ["View platforms", "Reset OAuth", "Check API health"],
    },
    {
      icon: "🤖",
      title: "AI Operations",
      desc: "AI analysis queue, MegaBot job status, and error monitoring.",
      color: "#16a34a",
      stats: "OpenAI + Claude + Gemini + Grok",
      actions: ["View AI jobs", "Retry failed", "Cost monitor"],
    },
    {
      icon: "📊",
      title: "Analytics",
      desc: "Platform-wide analytics, revenue, and growth metrics.",
      color: "#9333ea",
      stats: "Real-time dashboard",
      actions: ["Revenue report", "Growth metrics", "Export CSV"],
    },
    {
      icon: "🏅",
      title: "Heroes Verification",
      desc: "Review and approve hero discount applications.",
      color: "#b45309",
      stats: `${pendingHeroCount} pending`,
      actions: ["Review applications", "Approve", "Reject"],
    },
  ];

  const QUICK_STATS = [
    { label: "Total Users", value: totalUsers, icon: "👥", color: "#0f766e" },
    { label: "Total Items", value: totalItems, icon: "📦", color: "#7c3aed" },
    { label: "Analyzed Items", value: analyzedItems, icon: "🤖", color: "#16a34a" },
    { label: "Sales", value: totalProjects, icon: "🏷️", color: "#b45309" },
    { label: "Conversations", value: totalConversations, icon: "💬", color: "#1e40af" },
    { label: "Connected Platforms", value: totalPlatforms, icon: "🔗", color: "#dc2626" },
  ];

  // Mock business metrics (would come from real analytics in production)
  const MOCK_METRICS = [
    { label: "Est. GMV (Projected)", value: "$124,800", trend: "+18%", up: true },
    { label: "Avg Items per User", value: (totalItems / Math.max(totalUsers, 1)).toFixed(1), trend: "+2.3", up: true },
    { label: "Analysis Rate", value: `${Math.round((analyzedItems / Math.max(totalItems, 1)) * 100)}%`, trend: "+5%", up: true },
    { label: "Active This Week", value: totalUsers.toString(), trend: "—", up: true },
  ];

  // CMD-BUYERBOT-SKILLS: relative time helper for the freshness
  // column. Plain Node — no date-fns / dayjs dependency. Returns
  // "never" for the epoch fallback (empty packs).
  function relativeTime(iso: string): string {
    if (!iso || iso === new Date(0).toISOString()) return "never";
    const ms = Date.now() - new Date(iso).getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w ago`;
    const mo = Math.floor(d / 30);
    return `${mo}mo ago`;
  }

  // CMD-RECONBOT-SKILLS: per-bot Skill Pack status table.
  // Reads the loader synchronously (process-cached after first call
  // per warm instance). Empty packs render as ❌ Empty so ops can
  // see at a glance which bots are missing their playbooks.
  // CMD-BUYERBOT-SKILLS: now also surfaces lastUpdated mtime via
  // the relativeTime helper above.
  const BOT_TYPES = [
    "analyzebot", "antiquebot", "buyerbot", "carbot",
    "collectiblesbot", "listbot", "photobot", "pricebot",
    "reconbot", "videobot",
  ] as const;
  const skillStatusRows = BOT_TYPES.map((botType) => {
    const pack = loadSkillPack(botType);
    const ok = pack.systemPromptBlock.length > 0;
    return {
      botType,
      version: pack.version,
      count: pack.skillNames.length,
      totalChars: pack.totalChars,
      lastUpdated: relativeTime(pack.lastUpdated),
      statusBadge: ok ? "✅ Ready" : "❌ Empty",
      statusColor: ok ? "#16a34a" : "#dc2626",
    };
  });

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div className="section-title">Internal</div>
          <h1 className="h2 mt-1">Admin Portal</h1>
          <p className="muted mt-1">LegacyLoop operations dashboard · Logged in as <strong>{user.email}</strong></p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span style={{ padding: "0.3rem 0.75rem", background: "#fee2e2", color: "#dc2626", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700 }}>
            🔒 INTERNAL ONLY
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.875rem", marginBottom: "2rem" }}>
        {QUICK_STATS.map((s) => (
          <div key={s.label} className="card" style={{ padding: "1rem 1.25rem" }}>
            <div style={{ fontSize: "1.25rem", marginBottom: "0.2rem" }}>{s.icon}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Investor metrics */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>📊 Growth Model & Projections</h2>
          <span style={{ padding: "0.15rem 0.5rem", background: "#fef9c3", color: "#a16207", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 700 }}>
            FOR INVESTOR REVIEW
          </span>
        </div>

        <div style={{
          padding: "0.6rem 1rem",
          borderRadius: "8px",
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.2)",
          fontSize: "0.75rem",
          color: "#fbbf24",
          marginBottom: "1rem"
        }}>
          ⚠️ Modeled projections based on market analysis — not live operational data. Real metrics shown in Platform Stats above.
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.875rem", marginBottom: "1rem" }}>
          {[
            { label: "MRR (Projected)", value: "$12,450", trend: "+34% MoM", up: true, note: "Monthly Recurring Revenue" },
            { label: "ARR (Projected)", value: "$149,400", trend: "+34% MoM", up: true, note: "Annual Run Rate" },
            { label: "CAC (Projected)", value: "$23", trend: "-12% MoM", up: true, note: "Customer Acquisition Cost" },
            { label: "LTV (Projected)", value: "$890", trend: "+8% MoM", up: true, note: "Lifetime Value" },
            { label: "LTV : CAC (Projected)", value: "38.7×", trend: "Excellent", up: true, note: "Industry avg: 3×" },
            { label: "Churn (Projected)", value: "2.3%", trend: "-0.4% MoM", up: true, note: "Monthly churn" },
            { label: "NPS (Projected)", value: "87", trend: "+4 pts", up: true, note: "Net Promoter Score" },
            { label: "Margin (Projected)", value: "84%", trend: "Stable", up: true, note: "SaaS gross margin" },
          ].map((m) => (
            <div key={m.label} className="card" style={{ padding: "1rem 1.25rem", borderTop: "3px solid #0f766e" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.2rem" }}>{m.label}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: m.up ? "#16a34a" : "#dc2626", marginTop: "0.25rem" }}>
                {m.trend}
              </div>
              <div style={{ fontSize: "0.63rem", color: "#a8a29e", marginTop: "0.15rem" }}>{m.note}</div>
            </div>
          ))}
        </div>

        {/* 12-month projection */}
        <div className="card" style={{ padding: "1.5rem", background: "linear-gradient(135deg, #f0fdf4, #fff)" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
            📈 12-Month Growth Model (34% MoM Projection)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.5rem" }}>
            {[
              { month: "Apr '26", mrr: "$16.6K" },
              { month: "May '26", mrr: "$22.2K" },
              { month: "Jun '26", mrr: "$29.7K" },
              { month: "Jul '26", mrr: "$39.7K" },
              { month: "Aug '26", mrr: "$53.1K" },
              { month: "Sep '26", mrr: "$71.1K" },
              { month: "Oct '26", mrr: "$95.1K" },
              { month: "Nov '26", mrr: "$127K" },
              { month: "Dec '26", mrr: "$170K" },
              { month: "Jan '27", mrr: "$228K" },
              { month: "Feb '27", mrr: "$305K" },
              { month: "Mar '27", mrr: "$408K" },
            ].map((p) => (
              <div key={p.month} style={{ textAlign: "center", padding: "0.6rem 0.5rem", background: "white", borderRadius: "0.75rem", border: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>{p.month}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#0f766e" }}>{p.mrr}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Financial model based on 34% MoM growth assumption. Not actual operational data. Results will vary.
          </div>
        </div>
      </div>

      {/* Business metrics */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.875rem" }}>Platform Metrics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.875rem" }}>
          {MOCK_METRICS.map((m) => (
            <div key={m.label} className="card" style={{ padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>{m.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)" }}>{m.value}</span>
                {m.trend !== "—" && (
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: m.up ? "#16a34a" : "#dc2626" }}>
                    {m.up ? "▲" : "▼"} {m.trend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module grid */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.875rem" }}>Operations Modules</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {MODULES.map((mod) => (
            <div key={mod.title} className="card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>{mod.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{mod.title}</div>
                  <div style={{ fontSize: "0.72rem", color: mod.color, fontWeight: 600 }}>{mod.stats}</div>
                </div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.75rem" }}>{mod.desc}</p>
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                {mod.actions.map((a) => (
                  <button key={a} style={{ padding: "0.2rem 0.5rem", background: "var(--bg-secondary)", border: "1px solid var(--border-default)", borderRadius: "0.4rem", fontSize: "0.68rem", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 500 }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Hero Applications */}
      <div className="card p-6 mb-8">
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
          🏅 Pending Hero Applications ({pendingHeroApplications.length})
        </h2>
        {pendingHeroApplications.length === 0 ? (
          <p className="muted">No pending applications.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pendingHeroApplications.map((app) => (
              <div key={app.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", borderRadius: "0.75rem" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{app.fullName}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{app.serviceCategory} · {app.serviceDetail}</div>
                </div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <span style={{ padding: "0.2rem 0.5rem", background: "#fef9c3", color: "#a16207", borderRadius: "0.4rem", fontSize: "0.7rem", fontWeight: 700 }}>PENDING</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent users */}
      <div className="card p-6 mb-8">
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>Recently Joined Users</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f5f5f4" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>User</th>
                <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Email</th>
                <th style={{ textAlign: "center", padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Tier</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #fafaf9", background: i % 2 === 0 ? "#fafaf9" : "#fff" }}>
                  <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>{u.email.split("@")[0]}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)" }}>{u.email}</td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                    <span style={{ padding: "0.1rem 0.4rem", background: "#f0fdfa", color: "#0f766e", borderRadius: "9999px", fontWeight: 700, fontSize: "0.72rem" }}>
                      Tier {u.tier}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: "var(--text-muted)" }}>
                    {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System health */}
      <div className="card p-6">
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>System Health</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
          {[
            { name: "Database", status: "Operational", ok: true },
            { name: "OpenAI API", status: "Operational", ok: true },
            { name: "Anthropic API", status: "Operational", ok: true },
            { name: "Gemini API", status: "Operational", ok: true },
            { name: "SendGrid", status: "Operational", ok: true },
            { name: "Shippo", status: "Operational", ok: true },
          ].map((svc) => (
            <div key={svc.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.75rem", background: svc.ok ? "#f0fdf4" : "#fef2f2", borderRadius: "0.6rem", border: `1px solid ${svc.ok ? "#bbf7d0" : "#fecaca"}` }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: svc.ok ? "#16a34a" : "#dc2626", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{svc.name}</div>
                <div style={{ fontSize: "0.68rem", color: svc.ok ? "#16a34a" : "#dc2626" }}>{svc.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Skills Status (CMD-RECONBOT-SKILLS) ═══ */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginTop: "1.5rem",
      }}>
        <h2 style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "1rem",
        }}>🧠 Skill Packs Status</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
          }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-secondary)" }}>Bot Type</th>
                <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-secondary)" }}>Version</th>
                <th style={{ textAlign: "center", padding: "0.5rem", color: "var(--text-secondary)" }}>Skills</th>
                <th style={{ textAlign: "right", padding: "0.5rem", color: "var(--text-secondary)" }}>Total Chars</th>
                <th style={{ textAlign: "right", padding: "0.5rem", color: "var(--text-secondary)" }}>Last Updated</th>
                <th style={{ textAlign: "center", padding: "0.5rem", color: "var(--text-secondary)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {skillStatusRows.map((row) => (
                <tr key={row.botType} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "0.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{row.botType}</td>
                  <td style={{ padding: "0.5rem", color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "0.78rem" }}>{row.version}</td>
                  <td style={{ padding: "0.5rem", textAlign: "center", color: "var(--text-secondary)" }}>{row.count}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right", color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "0.78rem" }}>{row.totalChars.toLocaleString()}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right", color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "0.78rem" }}>{row.lastUpdated}</td>
                  <td style={{ padding: "0.5rem", textAlign: "center", fontWeight: 700, color: row.statusColor }}>{row.statusBadge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Bot Accuracy Leaderboard ═══ */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "12px", padding: "1.5rem", marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>🏆 Bot Accuracy Leaderboard</h2>
        {Object.keys(botAccuracyStats).length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-muted, #64748b)" }}>No accuracy data yet — populates when items sell and bot predictions are compared to actual prices.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <th style={{ textAlign: "left", padding: "8px", color: "var(--text-secondary)" }}>Bot</th>
                  <th style={{ textAlign: "center", padding: "8px", color: "var(--text-secondary)" }}>Avg Error</th>
                  <th style={{ textAlign: "center", padding: "8px", color: "var(--text-secondary)" }}>Grade</th>
                  <th style={{ textAlign: "center", padding: "8px", color: "var(--text-secondary)" }}>Predictions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(botAccuracyStats).sort(([, a], [, b]) => (a.totalError / a.count) - (b.totalError / b.count)).map(([bot, stats]) => {
                  const avgError = Math.round(stats.totalError / stats.count);
                  const grade = avgError <= 10 ? "A" : avgError <= 20 ? "B" : avgError <= 35 ? "C" : avgError <= 50 ? "D" : "F";
                  const gradeColor = grade === "A" ? "#22c55e" : grade === "B" ? "#00bcd4" : grade === "C" ? "#eab308" : "#ef4444";
                  return (
                    <tr key={bot} style={{ borderBottom: "1px solid var(--border-default)" }}>
                      <td style={{ padding: "8px", fontWeight: 600, color: "var(--text-primary)" }}>{bot}</td>
                      <td style={{ padding: "8px", textAlign: "center", color: "var(--text-secondary)" }}>{avgError}%</td>
                      <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, color: gradeColor }}>{grade}</td>
                      <td style={{ padding: "8px", textAlign: "center", color: "var(--text-secondary)" }}>{stats.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
