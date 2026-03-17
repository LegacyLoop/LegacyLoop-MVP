import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import SettingsClient from "./SettingsClient";
import ThemeSettings from "./ThemeSettings";
import ChangePasswordSection from "./ChangePasswordSection";

export default async function SettingsPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const consent = await prisma.dataCollectionConsent.findUnique({
    where: { userId: user.id },
  }).catch((e) => { console.error("[settings] consent query failed:", e); return null; });

  const consentData = consent
    ? {
        dataCollection: consent.dataCollection,
        aiTraining: consent.aiTraining,
        marketResearch: consent.marketResearch,
        anonymousSharing: consent.anonymousSharing,
        creditsEarned: consent.creditsEarned,
        consentedAt: consent.consentedAt?.toISOString() ?? null,
      }
    : null;

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-title">Account</div>
        <h1 className="h1 mt-2">Settings</h1>
        <p className="muted mt-1">Manage privacy, notifications, and preferences.</p>
      </div>

      <ThemeSettings />

      <SettingsClient userId={user.id} email={user.email} consent={consentData} />

      {/* Password section */}
      <ChangePasswordSection />

      {/* Your Data */}
      <div className="card p-6 mt-4">
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary, #1c1917)", marginBottom: "0.25rem" }}>
          Your Data
        </div>
        <div style={{ color: "var(--text-muted, #78716c)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          Download a copy of your account data or inventory.
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a href="/api/export/user-data" download className="btn-ghost" style={{ fontSize: "0.85rem" }}>
            Export My Data (JSON)
          </a>
          <a href="/api/export/inventory" download className="btn-ghost" style={{ fontSize: "0.85rem" }}>
            Export Inventory (CSV)
          </a>
        </div>
      </div>

      {/* Danger zone */}
      <div
        className="card p-6 mt-4"
        style={{ borderColor: "rgba(220, 38, 38, 0.25)", background: "rgba(254, 242, 242, 0.8)" }}
      >
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#9a3412", marginBottom: "0.25rem" }}>
          Danger Zone
        </div>
        <div style={{ color: "#78716c", fontSize: "0.85rem", marginBottom: "1rem" }}>
          Canceling your subscription or requesting data deletion are permanent actions.
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/subscription" className="btn-ghost" style={{ fontSize: "0.82rem", borderColor: "rgba(220,38,38,0.3)", color: "#9a3412" }}>
            Manage Subscription
          </Link>
        </div>
      </div>
    </div>
  );
}
