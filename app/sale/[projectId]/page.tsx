import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import ShareButtons from "@/app/components/ShareButtons";
import { safeJson } from "@/lib/utils/json";

type Params = Promise<{ projectId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } })
    .catch(() => null);
  if (!project) return { title: "Sale Not Found · LegacyLoop" };
  const typeLabel = project.type === "ESTATE_SALE" ? "Estate Sale" : "Garage Sale";
  return {
    title: `${project.name} · LegacyLoop ${typeLabel}`,
    description: project.description || `Browse items from ${project.name}. AI-priced estate sale items available.`,
    openGraph: { title: project.name, description: project.description ?? `${typeLabel} on LegacyLoop`, type: "website" },
  };
}

export default async function PublicSalePage({ params }: { params: Params }) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      user: { select: { id: true, email: true } },
      items: {
        where: { status: { in: ["LISTED", "INTERESTED", "ANALYZED", "READY"] } },
        include: {
          photos: { take: 1 },
          valuation: true,
          antiqueCheck: true,
          aiResult: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  }).catch((e) => { console.error("[sale] project query failed:", e); return null; });

  if (!project) {
    return (
      <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", borderRadius: "1.25rem", padding: "2rem", maxWidth: "36rem", margin: "2.5rem auto 0", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)" }}>Sale not found</div>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>This sale may have ended or been removed.</p>
      </div>
    );
  }

  const typeLabel = project.type === "ESTATE_SALE" ? "🏠 Estate Sale" : "🚗 Garage Sale";
  const ownerName = project.user.email.split("@")[0];
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const saleUrl = `${BASE_URL}/sale/${project.id}`;

  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</a>
        <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>/</span>
        <span style={{ color: "var(--text-muted)" }}>Sales</span>
        <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>/</span>
        <span style={{ color: "var(--text-primary)" }}>{project.name}</span>
      </div>

      {/* Event banner */}
      <div style={{
        background: "linear-gradient(135deg, var(--bg-secondary), var(--bg-card-solid))",
        borderRadius: "1.5rem",
        padding: "2.5rem",
        color: "var(--text-primary)",
        marginBottom: "2rem",
      }}>
        <div style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>
          {typeLabel}
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>{project.name}</h1>

        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", flexWrap: "wrap", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
          {project.startDate && (
            <span>📅 {new Date(project.startDate).toLocaleDateString()}{project.endDate ? ` – ${new Date(project.endDate).toLocaleDateString()}` : ""}</span>
          )}
          {project.city && project.state && (
            <span>📍 {project.city}, {project.state}</span>
          )}
          <span>{project.items.length} item{project.items.length !== 1 ? "s" : ""} available</span>
        </div>

        {project.description && (
          <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>
            {project.description}
          </p>
        )}

        <div style={{ marginTop: "1.25rem" }}>
          <ShareButtons
            url={saleUrl}
            title={project.name}
            description={project.description || `${project.name} — ${typeLabel} on LegacyLoop`}
          />
        </div>
      </div>

      {/* Items by category */}
      {project.items.length === 0 ? (
        <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", borderRadius: "1.25rem", padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
          <p style={{ color: "var(--text-muted)" }}>No items listed yet. Check back soon!</p>
        </div>
      ) : (() => {
        // Group items by category
        const grouped: Record<string, typeof project.items> = {};
        project.items.forEach((item) => {
          const ai = safeJson(item.aiResult?.rawJson);
          const cat = item.category || ai?.category || ai?.item_type || "Other";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(item);
        });
        const categoryOrder = Object.keys(grouped).sort();

        return (
          <div>
            {categoryOrder.map((cat) => (
              <div key={cat}>
                <div style={{
                  fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  marginBottom: "0.75rem", marginTop: "1.5rem",
                  paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-default)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span>{cat}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--text-muted)" }}>
                    {grouped[cat].length} item{grouped[cat].length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
                  {grouped[cat].map((item) => {
                    const ai = safeJson(item.aiResult?.rawJson);
                    const title = item.title || ai?.item_name || `Item #${item.id.slice(0, 8)}`;
                    const price = item.listingPrice ? Number(item.listingPrice) : null;
                    const est = item.valuation ? { low: item.valuation.low, high: item.valuation.high } : null;
                    const isSold = ["SOLD", "SHIPPED", "COMPLETED"].includes(item.status);

                    return (
                      <Link
                        key={item.id}
                        href={`/store/${project.user.id}/item/${item.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <div
                          style={{
                            background: "var(--bg-card-solid)",
                            border: item.antiqueCheck?.isAntique ? "1px solid #fbbf24" : "1px solid var(--border-default)",
                            borderRadius: "1.25rem",
                            overflow: "hidden",
                            cursor: "pointer",
                            opacity: isSold ? 0.65 : 1,
                          }}
                        >
                          <div style={{ position: "relative" }}>
                            {item.photos[0] ? (
                              <img src={item.photos[0].filePath} alt={title} loading="lazy" style={{ height: "13rem", width: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ height: "13rem", width: "100%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: "2.25rem", color: "var(--text-muted)", opacity: 0.5 }}>📷</span>
                              </div>
                            )}
                            {isSold && (
                              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ background: "#dc2626", color: "#fff", fontWeight: 800, padding: "0.3rem 1rem", borderRadius: "9999px", fontSize: "0.85rem" }}>SOLD</span>
                              </div>
                            )}
                          </div>
                          <div style={{ padding: "1rem" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.3 }}>{title}</div>
                            {item.condition && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{item.condition}</div>}
                            <div style={{ marginTop: "0.5rem" }}>
                              {price != null ? (
                                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--accent)" }}>${price.toLocaleString()}</span>
                              ) : est ? (
                                <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                                  Est. ${Math.round(est.low)}–${Math.round(est.high)}
                                </span>
                              ) : (
                                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Make an offer</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Questions about this sale? */}
      <div style={{
        marginTop: "2rem", background: "var(--bg-card-solid)",
        border: "1px solid var(--border-default)", borderRadius: "1.25rem",
        padding: "2rem", textAlign: "center",
      }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Questions about this sale?
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Browse items and contact the seller directly from any listing.
        </div>
        <a href={`/store/${project.user.id}`} style={{
          display: "inline-block", padding: "0.65rem 1.5rem",
          background: "var(--accent)", color: "#fff", borderRadius: "0.75rem",
          fontSize: "0.85rem", fontWeight: 600, textDecoration: "none",
        }}>
          Visit Seller's Store
        </a>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "3rem", textAlign: "center", padding: "2rem", background: "var(--bg-secondary)", borderRadius: "1rem" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Organized by <strong>{ownerName}</strong> via <strong style={{ color: "var(--accent)" }}>LegacyLoop</strong> · AI-powered estate sales
        </div>
        <Link href="/pricing" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", marginTop: "0.25rem", display: "inline-block" }}>
          Sell your own items →
        </Link>
      </div>
    </div>
  );
}
