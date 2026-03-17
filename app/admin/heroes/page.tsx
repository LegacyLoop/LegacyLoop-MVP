import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { isAdmin } from "@/lib/constants/admin";

export const metadata: Metadata = { title: "Heroes Review · Admin · LegacyLoop" };

export default async function AdminHeroesPage() {
  const user = await authAdapter.getSession();
  if (!user || !isAdmin(user.email)) redirect("/dashboard");

  // Get hero verifications - use try/catch in case model doesn't exist yet
  let pendingVerifications: any[] = [];
  let approvedVerifications: any[] = [];
  let rejectedVerifications: any[] = [];

  try {
    const all = await prisma.heroVerification.findMany({
      orderBy: { createdAt: "desc" },
    });
    pendingVerifications = all.filter(v => v.status === "PENDING");
    approvedVerifications = all.filter(v => v.status === "APPROVED");
    rejectedVerifications = all.filter(v => v.status === "REJECTED");
  } catch {
    // Model may not exist yet
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <Link href="/admin" style={{ color: "var(--accent)", fontSize: "0.82rem", textDecoration: "none" }}>← Admin</Link>
          <h1 className="h2 mt-2">Heroes Verification</h1>
          <p className="muted mt-1">Review and approve veteran/first responder discount applications.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Pending", count: pendingVerifications.length, color: "#eab308" },
          { label: "Approved", count: approvedVerifications.length, color: "#22c55e" },
          { label: "Denied", count: rejectedVerifications.length, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} style={{
            padding: "1.25rem", borderRadius: "1rem",
            background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Queue */}
      <div style={{
        borderRadius: "1rem", background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
        padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
          Pending Review ({pendingVerifications.length})
        </div>
        {pendingVerifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            No pending verifications.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pendingVerifications.map((v: any) => (
              <div key={v.id} style={{
                padding: "1rem 1.25rem", borderRadius: "0.75rem",
                background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.15)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{v.fullName}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      {v.serviceCategory} · {v.serviceDetail || "Not specified"}
                    </div>
                    {v.department && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Dept: {v.department}</div>
                    )}
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {v.email} · Applied {new Date(v.createdAt).toLocaleDateString()}
                    </div>
                    {v.proofFileName && (
                      <div style={{ fontSize: "0.72rem", color: "var(--accent)", marginTop: "0.2rem" }}>
                        Attachment: {v.proofFileName}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span style={{
                      padding: "0.35rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 700,
                      background: "rgba(22,163,74,0.1)", color: "#22c55e", border: "1px solid rgba(22,163,74,0.2)",
                      cursor: "pointer",
                    }}>Approve</span>
                    <span style={{
                      padding: "0.35rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 700,
                      background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)",
                      cursor: "pointer",
                    }}>Deny</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Approved */}
      <div style={{
        borderRadius: "1rem", background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
        padding: "1.5rem",
      }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
          Recently Approved ({approvedVerifications.length})
        </div>
        {approvedVerifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No approved verifications yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {approvedVerifications.slice(0, 10).map((v: any) => (
              <div key={v.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                background: "rgba(22,163,74,0.05)",
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{v.fullName}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: "0.5rem" }}>{v.serviceCategory}</span>
                </div>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: "rgba(22,163,74,0.12)", color: "#22c55e" }}>APPROVED</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
