import Link from "next/link";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { WHITE_GLOVE, PROCESSING_FEE, calculateProcessingFee } from "@/lib/constants/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "White-Glove Services · LegacyLoop", description: "Full-service estate liquidation with dedicated managers" };

const TIER_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ESSENTIALS:    { label: "Essentials",    color: "#92400e", bg: "#fef3c7" },
  PROFESSIONAL:  { label: "Professional",  color: "#1e40af", bg: "#dbeafe" },
  LEGACY:        { label: "Legacy",        color: "#6d28d9", bg: "#ede9fe" },
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  QUOTE_REQUESTED: { label: "Quote Requested", color: "var(--text-muted)", bg: "#f3f4f6" },
  QUOTE_SENT:      { label: "Quote Sent",      color: "#92400e", bg: "#fef3c7" },
  DEPOSIT_PAID:    { label: "Deposit Paid",    color: "var(--accent)", bg: "#ccfbf1" },
  IN_PROGRESS:     { label: "In Progress",     color: "#1e40af", bg: "#dbeafe" },
  COMPLETED:       { label: "Completed",       color: "#15803d", bg: "#dcfce7" },
};

export default async function WhiteGlovePage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const projects = await prisma.whiteGloveProject.findMany({
    where: { userId: user.id },
    include: { phases: { orderBy: { phaseNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  }).catch((e) => { console.error("[white-glove] projects query failed:", e); return []; });

  return (
    <div className="mx-auto max-w-4xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "White-Glove" }]} />
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <div className="section-title">White-Glove Service</div>
          <h1 className="h2 mt-2">Full-Service Estate Projects</h1>
          <p className="muted mt-2">
            Professional estate clearing with full team coordination, photography, and guaranteed results.
          </p>
        </div>
        <Link href="/quote" className="btn-primary whitespace-nowrap">
          + New Sale Quote
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🏡</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>No projects yet</h2>
          <p className="muted mb-6">
            White-glove service handles everything — photography, pricing, selling, junk removal, and donation coordination.
          </p>
          <Link href="/quote" className="btn-primary">Request a free quote →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const tier = TIER_LABELS[project.tier] ?? TIER_LABELS.ESSENTIALS;
            const status = STATUS_LABELS[project.status] ?? STATUS_LABELS.QUOTE_REQUESTED;
            const completedPhases = project.phases.filter((p) => p.status === "COMPLETED").length;
            const totalPhases = project.phases.length;
            const phasePct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

            return (
              <Link
                key={project.id}
                href={`/white-glove/${project.id}`}
                className="card card-hover p-6 block"
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                      <span style={{ padding: "0.15rem 0.6rem", borderRadius: "999px", background: tier.bg, color: tier.color, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {tier.label}
                      </span>
                      <span style={{ padding: "0.15rem 0.6rem", borderRadius: "999px", background: status.bg, color: status.color, fontSize: "0.72rem", fontWeight: 700 }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>
                      {project.address}, {project.city}
                    </div>
                    <div className="muted text-sm" style={{ marginTop: "0.2rem" }}>
                      {project.bedrooms ? `${project.bedrooms} BR · ` : ""}
                      ~{project.estimatedItems} items estimated
                      {project.projectManager ? ` · PM: ${project.projectManager}` : ""}
                    </div>

                    {totalPhases > 0 && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                          <span>Project progress</span>
                          <span>{completedPhases}/{totalPhases} phases · {phasePct}%</span>
                        </div>
                        <div style={{ height: "6px", background: "var(--bg-card-hover)", borderRadius: "9999px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${phasePct}%`, background: "var(--accent)", borderRadius: "9999px" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent)" }}>
                      ${project.totalUpfront.toLocaleString()}
                    </div>
                    <div className="muted text-xs">
                      upfront + {Math.round(project.commission * 100)}% commission
                    </div>
                    {project.estimatedValue && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                        Est. value: ${project.estimatedValue.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Service overview cards */}
      <div className="mt-10">
        <div className="section-title mb-4">Service Tiers</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          {[
            { tier: "ESSENTIALS", key: "essentials", items: ["Professional photography", "AI-powered pricing", "Online + local listings", "30-day active selling", "Donation coordination"] },
            { tier: "PROFESSIONAL", key: "professional", items: ["Everything in Essentials", "Appraisal of key items", "Antique specialist review", "Junk removal coordination", "90-day extended selling"] },
            { tier: "LEGACY", key: "legacy", items: ["Everything in Professional", "Family story documentation", "Premium marketing", "Museum/auction connections", "1-year access & archives"] },
          ].map((t) => {
            const wg = WHITE_GLOVE[t.key];
            const tl = TIER_LABELS[t.tier];
            return (
              <div key={t.tier} className="card p-5">
                <span style={{ padding: "0.15rem 0.6rem", borderRadius: "999px", background: tl.bg, color: tl.color, fontSize: "0.72rem", fontWeight: 700 }}>
                  {tl.label}
                </span>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.5rem", color: "var(--text-primary)" }}>${wg.preLaunch.toLocaleString()}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{wg.commissionPct}% commission on sales</div>
                <div style={{
                  marginTop: "0.5rem", padding: "0.5rem 0.6rem",
                  background: "rgba(0,188,212,0.05)", border: "1px solid rgba(0,188,212,0.12)",
                  borderRadius: "0.5rem", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.6,
                }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.15rem" }}>50% Deposit to Start</div>
                  <div>Deposit: ${(wg.preLaunch * 0.5).toLocaleString()}</div>
                  <div>+ {PROCESSING_FEE.rate * 100}% fee: ${calculateProcessingFee(wg.preLaunch * 0.5).toFixed(2)}</div>
                  <div style={{ fontWeight: 700, color: "var(--accent)" }}>
                    Total due: ${(wg.preLaunch * 0.5 + calculateProcessingFee(wg.preLaunch * 0.5)).toFixed(2)}
                  </div>
                </div>
                <ul style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {t.items.map((item) => (
                    <li key={item} style={{ display: "flex", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)", flexShrink: 0 }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
