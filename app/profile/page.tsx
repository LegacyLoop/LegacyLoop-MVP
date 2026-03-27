import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/app/components/Breadcrumbs";

const TIER_NAMES: Record<number, string> = {
  1: "Free",
  2: "Starter",
  3: "Plus",
  4: "Pro",
};

export default async function ProfilePage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  let credits = null, platforms: any[] = [], items: any[] = [], subscription = null;
  try {
    [credits, platforms, items, subscription] = await Promise.all([
      prisma.userCredits.findUnique({ where: { userId: user.id } }),
      prisma.connectedPlatform.findMany({ where: { userId: user.id } }),
      prisma.item.findMany({
        where: { userId: user.id },
        select: { status: true },
      }),
      prisma.subscription.findFirst({ where: { userId: user.id } }),
    ]);
  } catch (e) {
    console.error("[profile] DB queries failed:", e);
  }

  const displayName = user.email.split("@")[0];
  const initials = displayName.slice(0, 2).toUpperCase();
  const tierName = TIER_NAMES[user.tier] ?? `Tier ${user.tier}`;

  const totalItems = items.length;
  const listedItems = items.filter((i) => ["LISTED", "INTERESTED"].includes(i.status)).length;
  const soldItems = items.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status)).length;

  const connectedNames = platforms
    .filter((p) => p.isActive)
    .map((p) => p.platform);

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]} />
      {/* Page header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-title">Your Account</div>
        <h1 className="h1 mt-2">Profile</h1>
        <p className="muted mt-1">Your account info and activity at a glance.</p>
      </div>

      {/* Avatar + name card */}
      <div className="card p-8 mb-6" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div
          style={{
            width: "5rem",
            height: "5rem",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), #0097a7)",
            color: "#fff",
            fontSize: "1.75rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 16px rgba(0,188,212,0.35)",
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-primary)" }}>{displayName}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.2rem" }}>{user.email}</div>
          <div style={{ marginTop: "0.625rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                padding: "0.2rem 0.65rem",
                borderRadius: "9999px",
                background: "rgba(0, 188, 212, 0.1)",
                border: "1px solid rgba(0, 188, 212, 0.3)",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "0.05em",
              }}
            >
              {tierName.toUpperCase()} TIER
            </span>
            {subscription && (
              <span
                style={{
                  display: "inline-flex",
                  padding: "0.2rem 0.65rem",
                  borderRadius: "9999px",
                  background: "var(--success-bg)",
                  border: "1px solid var(--success-border)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--success-text)",
                  letterSpacing: "0.05em",
                }}
              >
                ACTIVE SUBSCRIPTION
              </span>
            )}
          </div>
        </div>
        <Link
          href="/auth/forgot-password"
          className="btn-ghost"
          style={{ fontSize: "0.82rem", padding: "0.5rem 0.875rem", whiteSpace: "nowrap" }}
        >
          Change Password
        </Link>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className="card p-5 text-center">
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>{totalItems}</div>
          <div className="section-title mt-1">Total Items</div>
        </div>
        <div className="card p-5 text-center">
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>{listedItems}</div>
          <div className="section-title mt-1">Active Listings</div>
        </div>
        <div className="card p-5 text-center">
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--success-text)" }}>{soldItems}</div>
          <div className="section-title mt-1">Items Sold</div>
        </div>
      </div>

      {/* Credits card */}
      <div className="card p-6 mb-4" style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, var(--warning-text), var(--accent))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            flexShrink: 0,
          }}
        >
          💎
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>
            {credits?.balance ?? 0} Credits Available
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.15rem" }}>
            {credits?.lifetime ?? 0} earned lifetime
          </div>
        </div>
        <Link href="/credits" className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.5rem 0.875rem" }}>
          Buy Credits
        </Link>
      </div>

      {/* Connected platforms */}
      {connectedNames.length > 0 && (
        <div className="card p-6 mb-4">
          <div className="section-title mb-3">Connected Platforms</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {connectedNames.map((name) => (
              <span key={name} className="badge" style={{ textTransform: "capitalize" }}>
                ✓ {name}
              </span>
            ))}
          </div>
          <Link
            href="/integrations"
            style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}
          >
            Manage integrations →
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="card p-6">
        <div className="section-title mb-4">Quick Links</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {[
            { href: "/subscription", label: "Subscription & Billing", desc: "Manage your plan, upgrade, or cancel" },
            { href: "/settings", label: "Privacy & Settings", desc: "Data sharing, notifications, and preferences" },
            { href: "/auth/forgot-password", label: "Change Password", desc: "Update your login credentials" },
            { href: "/referral", label: "Refer a Friend", desc: "Earn 50 credits per referral" },
          ].map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 0",
                borderBottom: "1px solid var(--border-default)",
                textDecoration: "none",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>{label}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.1rem" }}>{desc}</div>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "1rem", flexShrink: 0 }}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
