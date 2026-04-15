export default function BillingLoading() {
  const S = ({ h, w, r, delay, mb, style }: {
    h: number | string; w?: number | string;
    r?: string; delay?: string; mb?: string;
    style?: React.CSSProperties;
  }) => (
    <div
      className="skeleton"
      style={{
        height: typeof h === "number" ? `${h}px` : h,
        width: w ? (typeof w === "number" ? `${w}px` : w) : "100%",
        background: "linear-gradient(90deg, var(--skeleton-bg) 25%, var(--skeleton-highlight) 50%, var(--skeleton-bg) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.8s ease-in-out infinite",
        animationDelay: delay || "0s",
        borderRadius: r || "0.75rem",
        marginBottom: mb || undefined,
        ...style,
      }}
    />
  );

  return (
    <div style={{
      background: "var(--bg-primary)",
      minHeight: "100vh",
      padding: "1rem 1rem calc(64px + env(safe-area-inset-bottom, 8px) + 1rem)",
      maxWidth: "56rem",
      margin: "0 auto",
    }}>
      {/* Header: breadcrumb + section-title + H1 + subtitle */}
      <div style={{ marginBottom: "2rem" }}>
        <S h={14} w={120} mb="0.5rem" />
        <S h={14} w={80} mb="0.5rem" />
        <S h={36} w={200} mb="0.5rem" />
        <S h={16} w={320} />
      </div>

      {/* Current plan card */}
      <S h={180} r="1.25rem" mb="1.5rem" />

      {/* "Upgrade Your Plan" label */}
      <S h={16} w={140} mb="1rem" />

      {/* Tier cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[...Array(3)].map((_, i) => (
          <S key={i} h={320} r="1.25rem" delay={`${i * 0.1}s`} />
        ))}
      </div>

      {/* Billing history card */}
      <div style={{
        borderRadius: "1.25rem",
        background: "var(--ghost-bg)",
        border: "1px solid var(--border-default)",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}>
        <S h={14} w={140} mb="1rem" />
        <S h={36} r="0.5rem" mb="0.5rem" />
        {[...Array(6)].map((_, i) => (
          <S key={i} h={44} r="0.5rem" mb="0.25rem" delay={`${i * 0.05}s`} />
        ))}
      </div>

      {/* Downgrade card */}
      <S h={140} r="1.25rem" mb="1.5rem" />

      {/* Bottom links */}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        {[...Array(3)].map((_, i) => (
          <S key={i} h={44} w={130} r="0.75rem" delay={`${i * 0.08}s`} />
        ))}
      </div>
    </div>
  );
}
