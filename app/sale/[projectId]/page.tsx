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
      <div className="card p-8 max-w-xl mx-auto mt-10 text-center">
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <div className="text-xl font-semibold">Sale not found</div>
        <p className="muted mt-2">This sale may have ended or been removed.</p>
      </div>
    );
  }

  const typeLabel = project.type === "ESTATE_SALE" ? "🏠 Estate Sale" : "🚗 Garage Sale";
  const ownerName = project.user.email.split("@")[0];
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const saleUrl = `${BASE_URL}/sale/${project.id}`;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Event banner */}
      <div style={{
        background: "linear-gradient(135deg, #1c1917, #292524)",
        borderRadius: "1.5rem",
        padding: "2.5rem",
        color: "#fff",
        marginBottom: "2rem",
      }}>
        <div style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>
          {typeLabel}
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>{project.name}</h1>

        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", flexWrap: "wrap", color: "#d6d3d1", fontSize: "0.85rem" }}>
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

      {/* Items grid */}
      {project.items.length === 0 ? (
        <div className="card p-12 text-center">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
          <p className="muted">No items listed yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {project.items.map((item) => {
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
                  className="card overflow-hidden"
                  style={{
                    cursor: "pointer",
                    opacity: isSold ? 0.65 : 1,
                    ...(item.antiqueCheck?.isAntique ? { borderColor: "#fbbf24" } : {}),
                  }}
                >
                  <div style={{ position: "relative" }}>
                    {item.photos[0] ? (
                      <img src={item.photos[0].filePath} alt={title} className="h-52 w-full object-cover" />
                    ) : (
                      <div className="h-52 w-full bg-stone-100 flex items-center justify-center">
                        <span className="text-4xl text-stone-300">📷</span>
                      </div>
                    )}
                    {isSold && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ background: "#dc2626", color: "#fff", fontWeight: 800, padding: "0.3rem 1rem", borderRadius: "9999px", fontSize: "0.85rem" }}>SOLD</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.3 }}>{title}</div>
                    {item.condition && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{item.condition}</div>}
                    <div style={{ marginTop: "0.5rem" }}>
                      {price != null ? (
                        <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f766e" }}>${price.toLocaleString()}</span>
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
      )}

      {/* Footer */}
      <div style={{ marginTop: "3rem", textAlign: "center", padding: "2rem", background: "var(--bg-secondary)", borderRadius: "1rem" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Organized by <strong>{ownerName}</strong> via <strong style={{ color: "#0f766e" }}>LegacyLoop</strong> · AI-powered estate sales
        </div>
        <Link href="/pricing" style={{ fontSize: "0.8rem", color: "#0f766e", textDecoration: "none", marginTop: "0.25rem", display: "inline-block" }}>
          Sell your own items →
        </Link>
      </div>
    </div>
  );
}
