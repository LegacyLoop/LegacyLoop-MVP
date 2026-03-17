import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { computeAuthenticityScore, getTierStyles } from "@/lib/antique-score";
import Link from "next/link";
import PrintButton from "../PrintButton";

type Params = Promise<{ itemId: string }>;

function safeJsonParse(raw: string): any | null {
  try { return JSON.parse(raw); } catch { return null; }
}

export default async function CertificatePage({ params }: { params: Params }) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) {
    return <div style={{ maxWidth: "28rem", margin: "4rem auto", padding: "2rem", borderRadius: "1rem", background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", textAlign: "center" }}>
      <p style={{ color: "var(--text-primary)" }}>Please log in to view this certificate.</p>
    </div>;
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { aiResult: true, antiqueCheck: true, photos: { take: 1, orderBy: { order: "asc" } } },
  });

  if (!item || item.userId !== user.id) {
    return <div style={{ maxWidth: "28rem", margin: "4rem auto", padding: "2rem", borderRadius: "1rem", background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", textAlign: "center" }}>
      <p style={{ color: "var(--text-primary)" }}>Item not found.</p>
    </div>;
  }

  const aiObj = item.aiResult?.rawJson ? safeJsonParse(item.aiResult.rawJson) : null;
  const scoreResult = computeAuthenticityScore({
    aiResult: item.aiResult,
    antiqueCheck: item.antiqueCheck ?? undefined,
  });

  if (scoreResult.score < 34) {
    return <div style={{ maxWidth: "28rem", margin: "4rem auto", padding: "2rem", borderRadius: "1rem", background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", textAlign: "center" }}>
      <p style={{ color: "var(--text-primary)", fontWeight: 600 }}>Certificate Not Available</p>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Authenticity certificates require a Gold tier score (34+). Current score: {scoreResult.score}/100.</p>
      <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.5rem" }}>Run AntiqueBot to increase your score.</p>
      <Link href={`/items/${itemId}`} style={{ display: "inline-block", marginTop: "1rem", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" }}>Back to Item</Link>
    </div>;
  }

  const tierStyles = getTierStyles(scoreResult.tier);
  const displayTitle = item.title || aiObj?.item_name || `Item #${item.id.slice(0, 8)}`;
  const analysisDate = item.antiqueCheck?.createdAt
    ? new Date(item.antiqueCheck.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const breakdown = scoreResult.breakdown;

  return (
    <div style={{ maxWidth: "680px", margin: "2rem auto", padding: "0 1rem" }}>
      {/* Print button — hidden in print */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }} className="no-print">
        <Link href={`/items/${itemId}`} style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
          ← Back to Item
        </Link>
        <PrintButton />
      </div>

      {/* Certificate */}
      <div style={{
        background: "var(--bg-secondary)",
        border: `2px solid ${tierStyles.borderColor}`,
        borderRadius: "20px",
        padding: "3rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Corner decorations */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "60px", height: "60px", borderTop: `3px solid ${tierStyles.color}`, borderLeft: `3px solid ${tierStyles.color}`, borderRadius: "20px 0 0 0", opacity: 0.4 }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", borderTop: `3px solid ${tierStyles.color}`, borderRight: `3px solid ${tierStyles.color}`, borderRadius: "0 20px 0 0", opacity: 0.4 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "60px", height: "60px", borderBottom: `3px solid ${tierStyles.color}`, borderLeft: `3px solid ${tierStyles.color}`, borderRadius: "0 0 0 20px", opacity: 0.4 }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "60px", height: "60px", borderBottom: `3px solid ${tierStyles.color}`, borderRight: `3px solid ${tierStyles.color}`, borderRadius: "0 0 20px 0", opacity: 0.4 }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", color: "var(--accent)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            LegacyLoop AI Authentication System
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.08em", color: tierStyles.color, textTransform: "uppercase" }}>
            Antique Authenticity Certificate
          </div>
          <div style={{ width: "60px", height: "3px", background: "var(--accent)", margin: "0.75rem auto 0", borderRadius: "2px" }} />
        </div>

        {/* Score */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "5rem", fontWeight: 900, color: tierStyles.color, lineHeight: 1, marginBottom: "0.25rem" }}>
            {scoreResult.score}
            <span style={{ fontSize: "1.5rem", fontWeight: 500, color: "var(--text-muted)" }}>/100</span>
          </div>
          <div style={{
            display: "inline-block",
            background: tierStyles.background,
            border: `1px solid ${tierStyles.borderColor}`,
            borderRadius: "20px",
            padding: "0.3rem 1rem",
            color: tierStyles.color,
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}>
            {tierStyles.label} — {tierStyles.tierLabel}
          </div>
        </div>

        {/* Item details */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border-default)",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Item Details
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem" }}>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Item Name</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{displayTitle}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Category</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{aiObj?.category || "—"}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Estimated Age</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {aiObj?.estimated_age_years ? `~${aiObj.estimated_age_years} years` : aiObj?.era || "—"}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Analysis Date</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{analysisDate}</div>
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border-default)",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Score Breakdown
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-default)" }}>Source</th>
                <th style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-default)" }}>Points</th>
                <th style={{ textAlign: "right", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-default)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "AI Detection", score: breakdown.aiDetectionScore, max: 25, done: breakdown.aiDetectionScore > 0 },
                { label: "Age Bonus", score: breakdown.ageBonusScore, max: 8, done: breakdown.ageBonusScore > 0 },
                { label: "AntiqueBot Analysis", score: breakdown.antiqueBotScore, max: 33, done: breakdown.antiqueBotScore > 0 },
                { label: "MegaBot Consensus", score: breakdown.megaBotScore, max: 34, done: breakdown.megaBotScore > 0 },
              ].map((row) => (
                <tr key={row.label}>
                  <td style={{ fontSize: "0.82rem", color: "var(--text-primary)", padding: "0.5rem 0", borderBottom: "1px solid var(--border-default)" }}>{row.label}</td>
                  <td style={{ textAlign: "center", fontSize: "0.82rem", fontWeight: 700, color: tierStyles.color, padding: "0.5rem 0", borderBottom: "1px solid var(--border-default)" }}>{row.score}/{row.max}</td>
                  <td style={{ textAlign: "right", fontSize: "0.78rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border-default)", color: row.done ? "#10b981" : "var(--text-muted)" }}>{row.done ? "✓ Complete" : "—"}</td>
                </tr>
              ))}
              <tr>
                <td style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", paddingTop: "0.75rem" }}>Total</td>
                <td style={{ textAlign: "center", fontSize: "0.88rem", fontWeight: 800, color: tierStyles.color, paddingTop: "0.75rem" }}>{scoreResult.score}/100</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingTop: "1rem", borderTop: "1px solid var(--border-default)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            Generated by LegacyLoop AI Authentication System
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            {analysisDate} · Item ID: {item.id.slice(0, 12)}
          </div>
        </div>
      </div>
    </div>
  );
}
