/**
 * VehicleSpecsCard — displays vehicle-specific specs.
 * Renders inside CarBot panel and CarBot page.
 * Condition scores come from CarBot result or fallback to AI condition_score.
 */

interface Props {
  year?: string;
  make?: string;
  model?: string;
  mileage?: string;
  vinVisible?: boolean;
  conditionExterior?: number;  // 1-10
  conditionInterior?: number;  // 1-10
  conditionMechanical?: number; // 1-10
  saleMethod?: string;
}

function ratingColor(score: number | undefined): string {
  if (score == null) return "var(--text-muted)";
  if (score >= 7) return "#4ade80";
  if (score >= 4) return "#f59e0b";
  return "#ef4444";
}

function ratingBg(score: number | undefined): string {
  if (score == null) return "var(--bg-card)";
  if (score >= 7) return "rgba(74,222,128,0.08)";
  if (score >= 4) return "rgba(245,158,11,0.08)";
  return "rgba(239,68,68,0.08)";
}

function ratingBorder(score: number | undefined): string {
  if (score == null) return "var(--border-default)";
  if (score >= 7) return "rgba(74,222,128,0.25)";
  if (score >= 4) return "rgba(245,158,11,0.25)";
  return "rgba(239,68,68,0.25)";
}

export default function VehicleSpecsCard({
  year,
  make,
  model,
  mileage,
  vinVisible,
  conditionExterior,
  conditionInterior,
  conditionMechanical,
  saleMethod,
}: Props) {
  const ymm = [year, make, model].filter(Boolean).join(" ");
  const showLocalBanner =
    saleMethod === "LOCAL_PICKUP" || saleMethod === "BOTH" || true; // always for vehicles

  return (
    <div
      style={{
        background: "var(--bg-card)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,188,212,0.15)",
        borderRadius: "1rem",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0.875rem 1.25rem",
          borderBottom: "1px solid var(--border-default, var(--border-default))",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontSize: "1.15rem" }}>🚗</span>
        <span
          style={{
            fontWeight: 800,
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-primary)",
          }}
        >
          Vehicle Details
        </span>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {/* Year / Make / Model */}
        {ymm && (
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            {ymm}
          </div>
        )}

        {/* Mileage */}
        {mileage && (
          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
            }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              <strong>{mileage}</strong> miles
            </span>
          </div>
        )}

        {/* VIN visible indicator */}
        {vinVisible && (
          <div
            style={{
              marginTop: "0.5rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.65rem",
              borderRadius: "9999px",
              background: "rgba(0,188,212,0.08)",
              border: "1px solid rgba(0,188,212,0.2)",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--accent, #00bcd4)",
            }}
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            VIN visible in photos
          </div>
        )}

        {/* 3-column condition grid */}
        <div
          style={{
            marginTop: "1rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.75rem",
          }}
        >
          {[
            { label: "Exterior", score: conditionExterior, icon: "🎨" },
            { label: "Interior", score: conditionInterior, icon: "🪑" },
            { label: "Mechanical", score: conditionMechanical, icon: "⚙️" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                textAlign: "center",
                borderRadius: "0.75rem",
                padding: "0.75rem 0.5rem",
                border: `1px solid ${ratingBorder(item.score)}`,
                background: ratingBg(item.score),
              }}
            >
              <div style={{ fontSize: "0.65rem", marginBottom: "0.2rem" }}>{item.icon}</div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: ratingColor(item.score),
                }}
              >
                {item.score ?? "—"}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginTop: "0.15rem",
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOCAL PICKUP ONLY banner */}
      {showLocalBanner && (
        <div
          style={{
            padding: "0.625rem 1.25rem",
            background: "rgba(245,158,11,0.1)",
            borderTop: "1px solid rgba(245,158,11,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#f59e0b",
          }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          LOCAL PICKUP ONLY — Vehicles cannot be shipped
        </div>
      )}
    </div>
  );
}
