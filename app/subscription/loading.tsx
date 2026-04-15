export default function SubscriptionLoading() {
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
      padding: "2rem 1rem calc(64px + env(safe-area-inset-bottom, 8px) + 2rem)",
    }}>
      {/* ── Section 1: Subscription Plans ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto 4rem auto" }}>
        {/* SectionHeader: accent bar + H1 + subtitle (centered) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          <S h={4} w={64} r="2px" mb="1.25rem" />
          <S h={36} w={280} mb="0.65rem" />
          <S h={16} w={380} />
        </div>

        {/* Tab bar (2 pills) */}
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "2rem" }}>
          <S h={44} w={120} r="12px" />
          <S h={44} w={130} r="12px" delay="0.06s" />
        </div>

        {/* Current plan card */}
        <S h={220} r="24px" mb="1.5rem" />

        {/* Usage meters card */}
        <S h={100} r="16px" mb="1.5rem" delay="0.1s" />

        {/* Billing period toggle row */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", alignItems: "center", marginBottom: "2rem" }}>
          <S h={16} w={60} />
          <S h={28} w={52} r="14px" />
          <S h={16} w={50} />
          <S h={24} w={70} r="9999px" />
        </div>

        {/* Founders banner */}
        <S h={64} r="16px" mb="2rem" delay="0.15s" />

        {/* Feature table */}
        <div style={{
          borderRadius: "20px",
          background: "var(--ghost-bg)",
          border: "1px solid var(--border-default)",
          padding: "1rem",
          marginBottom: "2rem",
          overflow: "hidden",
        }}>
          <S h={44} r="0.5rem" mb="0.5rem" style={{ opacity: 0.7 }} />
          {[...Array(10)].map((_, i) => (
            <S key={i} h={40} r="0.5rem" mb={i < 9 ? "0.25rem" : undefined} delay={`${i * 0.04}s`} />
          ))}
        </div>
      </div>

      {/* ── Section 2: White-Glove Estate Services ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* SectionHeader (centered) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          <S h={4} w={64} r="2px" mb="1.25rem" />
          <S h={36} w={320} mb="0.65rem" />
          <S h={16} w={340} />
        </div>

        {/* Pre-launch estate banner */}
        <S h={56} r="12px" mb="1.5rem" delay="0.1s" />

        {/* Slide tab bar (3 pills) */}
        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
          {[...Array(3)].map((_, i) => (
            <S key={i} h={44} w={160} r="24px" delay={`${i * 0.06}s`} />
          ))}
        </div>

        {/* White Glove cards (3-col grid) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1rem" }}>
          {[...Array(3)].map((_, i) => (
            <S key={i} h={280} r="20px" delay={`${i * 0.12}s`} />
          ))}
        </div>
      </div>
    </div>
  );
}
