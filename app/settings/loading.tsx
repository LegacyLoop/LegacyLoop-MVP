export default function SettingsLoading() {
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
      maxWidth: 680,
      margin: "0 auto",
    }}>
      {/* Header: breadcrumb + section-title + H1 + subtitle */}
      <div style={{ marginBottom: "2rem" }}>
        <S h={14} w={160} mb="0.5rem" />
        <S h={14} w={80} mb="0.5rem" />
        <S h={36} w={120} mb="0.5rem" />
        <S h={16} w={280} />
      </div>

      {/* Theme settings card */}
      <S h={100} r="1.25rem" mb="1rem" />

      {/* Privacy toggles (4 rows) */}
      {[...Array(4)].map((_, i) => (
        <S key={i} h={48} r="0.75rem" mb="0.5rem" delay={`${i * 0.08}s`} />
      ))}

      {/* Password section card */}
      <S h={160} r="1.25rem" mb="1rem" style={{ marginTop: "1rem" }} />

      {/* Assessment card */}
      <S h={120} r="1.25rem" mb="1rem" />

      {/* Your Data card */}
      <S h={120} r="1.25rem" mb="1rem" />

      {/* Danger zone card */}
      <S h={140} r="1.25rem" mb="1rem" style={{ border: "1px solid var(--error, #ef4444)" }} />

      {/* Back to Dashboard link */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem" }}>
        <S h={36} w={180} r="0.5rem" />
      </div>
    </div>
  );
}
