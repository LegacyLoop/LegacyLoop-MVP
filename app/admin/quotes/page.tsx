import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { isAdmin } from "@/lib/constants/admin";

export const metadata: Metadata = { title: "Estate Quotes · Admin · LegacyLoop" };

function getThisWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatUrgency(u: string): string {
  switch (u) {
    case "asap": return "ASAP";
    case "this_month": return "This Month";
    case "next_month": return "Next Month";
    case "flexible": return "Flexible";
    default: return u;
  }
}

function tierLabel(tier: string): string {
  switch (tier) {
    case "DIGITAL_ONLY": return "Digital Only";
    case "PARTIAL": return "Partial Service";
    case "FULL": return "Full Service";
    case "PREMIUM": return "Premium White Glove";
    default: return tier;
  }
}

function statusColor(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case "NEW": return { bg: "rgba(0,188,212,0.08)", text: "#00bcd4", border: "rgba(0,188,212,0.2)" };
    case "REVIEWING": return { bg: "rgba(234,179,8,0.08)", text: "#eab308", border: "rgba(234,179,8,0.2)" };
    case "QUOTE_SENT": return { bg: "rgba(99,102,241,0.08)", text: "#6366f1", border: "rgba(99,102,241,0.2)" };
    case "ACCEPTED": return { bg: "rgba(22,163,74,0.08)", text: "#22c55e", border: "rgba(22,163,74,0.2)" };
    case "DECLINED": return { bg: "rgba(239,68,68,0.08)", text: "#ef4444", border: "rgba(239,68,68,0.2)" };
    default: return { bg: "var(--ghost-bg)", text: "var(--text-muted)", border: "var(--border-default)" };
  }
}

export default async function AdminQuotesPage() {
  const user = await authAdapter.getSession();
  if (!user || !isAdmin(user.email)) redirect("/dashboard");

  let allQuotes: any[] = [];
  let newThisWeek = 0;
  let contactedCount = 0;

  try {
    allQuotes = await prisma.serviceQuote.findMany({
      orderBy: { createdAt: "desc" },
    });

    const weekStart = getThisWeekStart();
    newThisWeek = allQuotes.filter(q => new Date(q.createdAt) >= weekStart).length;
    contactedCount = allQuotes.filter(q => q.status !== "NEW" && q.status !== "DECLINED").length;
  } catch {
    // Model may not exist yet
  }

  const newQuotes = allQuotes.filter(q => q.status === "NEW");
  const reviewingQuotes = allQuotes.filter(q => q.status === "REVIEWING");
  const sentQuotes = allQuotes.filter(q => q.status === "QUOTE_SENT");
  const acceptedQuotes = allQuotes.filter(q => q.status === "ACCEPTED");
  const declinedQuotes = allQuotes.filter(q => q.status === "DECLINED");

  const activeQuotes = [...newQuotes, ...reviewingQuotes, ...sentQuotes];

  return (
    <div className="mx-auto max-w-5xl">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <Link href="/admin" style={{ color: "var(--accent)", fontSize: "0.82rem", textDecoration: "none" }}>← Admin</Link>
          <h1 className="h2 mt-2">Estate Quote Submissions</h1>
          <p className="muted mt-1">Review incoming white-glove and estate service quote requests.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Quotes", count: allQuotes.length, color: "#00bcd4" },
          { label: "New This Week", count: newThisWeek, color: "#eab308" },
          { label: "Contacted", count: contactedCount, color: "#22c55e" },
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

      {/* Pipeline summary bar */}
      <div style={{
        display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap",
      }}>
        {[
          { label: "New", count: newQuotes.length, color: "#00bcd4" },
          { label: "Reviewing", count: reviewingQuotes.length, color: "#eab308" },
          { label: "Quote Sent", count: sentQuotes.length, color: "#6366f1" },
          { label: "Accepted", count: acceptedQuotes.length, color: "#22c55e" },
          { label: "Declined", count: declinedQuotes.length, color: "#ef4444" },
        ].map((p) => (
          <div key={p.label} style={{
            padding: "0.4rem 0.85rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700,
            background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30`,
          }}>
            {p.label}: {p.count}
          </div>
        ))}
      </div>

      {/* Active Quotes */}
      <div style={{
        borderRadius: "1rem", background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
        padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
          Active Quotes ({activeQuotes.length})
        </div>
        {activeQuotes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            No active quote submissions.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {activeQuotes.map((q: any) => {
              const sc = statusColor(q.status);
              let addOns: string[] = [];
              try { addOns = JSON.parse(q.addOnsJson || "[]"); } catch { /* ignore */ }

              return (
                <div key={q.id} style={{
                  padding: "1.15rem 1.25rem", borderRadius: "0.75rem",
                  background: "var(--bg-secondary)", border: "1px solid var(--border-default)",
                }}>
                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{q.fullName}</span>
                        <span style={{
                          fontSize: "0.6rem", fontWeight: 700, padding: "0.12rem 0.45rem", borderRadius: "0.3rem",
                          background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                          textTransform: "uppercase", letterSpacing: "0.03em",
                        }}>{q.status.replace("_", " ")}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                        {q.email} · {q.phone}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap" }}>
                      {new Date(q.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.4rem 1rem", marginBottom: "0.6rem" }}>
                    <div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Location</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>{q.city}, {q.state} {q.zip}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Property</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>
                        {q.propertyType}{q.bedrooms ? ` · ${q.bedrooms} BR` : ""}{q.squareFeet ? ` · ${q.squareFeet} sqft` : ""}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Est. Items</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>{q.estimatedItems}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Service Tier</div>
                      <div style={{ fontSize: "0.82rem", color: "#00bcd4", fontWeight: 600 }}>{tierLabel(q.requestedTier)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Urgency</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>{formatUrgency(q.urgency)}</div>
                    </div>
                    {q.quotedPrice && (
                      <div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Quoted Price</div>
                        <div style={{ fontSize: "0.82rem", color: "#22c55e", fontWeight: 700 }}>${q.quotedPrice.toLocaleString()}</div>
                      </div>
                    )}
                  </div>

                  {/* Add-ons */}
                  {addOns.length > 0 && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>Add-ons</div>
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                        {addOns.map((a: string) => (
                          <span key={a} style={{
                            padding: "0.15rem 0.45rem", borderRadius: "0.3rem", fontSize: "0.68rem", fontWeight: 600,
                            background: "rgba(0,188,212,0.08)", color: "#00bcd4", border: "1px solid rgba(0,188,212,0.15)",
                          }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {(q.specialItems || q.accessConcerns || q.additionalNotes) && (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.5rem", padding: "0.5rem 0.65rem", background: "var(--bg-card)", borderRadius: "0.4rem", border: "1px solid var(--border-default)" }}>
                      {q.specialItems && <div><strong>Special items:</strong> {q.specialItems}</div>}
                      {q.accessConcerns && <div><strong>Access concerns:</strong> {q.accessConcerns}</div>}
                      {q.additionalNotes && <div><strong>Notes:</strong> {q.additionalNotes}</div>}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {q.status === "NEW" && (
                      <span style={{
                        padding: "0.35rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 700,
                        background: "rgba(0,188,212,0.1)", color: "#00bcd4", border: "1px solid rgba(0,188,212,0.2)",
                        cursor: "pointer",
                      }}>Mark Contacted</span>
                    )}
                    {q.status === "REVIEWING" && (
                      <span style={{
                        padding: "0.35rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 700,
                        background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)",
                        cursor: "pointer",
                      }}>Send Quote</span>
                    )}
                    <span style={{
                      padding: "0.35rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 700,
                      background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)",
                      cursor: "pointer",
                    }}>Archive</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accepted / Completed */}
      <div style={{
        borderRadius: "1rem", background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
        padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
          Accepted Quotes ({acceptedQuotes.length})
        </div>
        {acceptedQuotes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No accepted quotes yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {acceptedQuotes.slice(0, 10).map((q: any) => (
              <div key={q.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                background: "rgba(22,163,74,0.05)",
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{q.fullName}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: "0.5rem" }}>
                    {q.city}, {q.state} · {tierLabel(q.requestedTier)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {q.quotedPrice && (
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#22c55e" }}>${q.quotedPrice.toLocaleString()}</span>
                  )}
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: "rgba(22,163,74,0.12)", color: "#22c55e" }}>ACCEPTED</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Declined */}
      {declinedQuotes.length > 0 && (
        <div style={{
          borderRadius: "1rem", background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
          padding: "1.5rem",
        }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
            Declined ({declinedQuotes.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {declinedQuotes.slice(0, 5).map((q: any) => (
              <div key={q.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                background: "rgba(239,68,68,0.03)",
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{q.fullName}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: "0.5rem" }}>
                    {q.city}, {q.state}
                  </span>
                </div>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>DECLINED</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
