export default function ProfileLoading() {
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
        <S h={14} w={100} mb="0.5rem" />
        <S h={36} w={100} mb="0.5rem" />
        <S h={16} w={240} />
      </div>

      {/* Avatar + name card */}
      <div style={{
        borderRadius: "1.25rem",
        background: "var(--ghost-bg)",
        border: "1px solid var(--border-default)",
        padding: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        marginBottom: "1.5rem",
      }}>
        <S h={80} w={80} r="50%" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <S h={22} w={160} mb="0.5rem" />
          <S h={14} w={200} mb="0.625rem" />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <S h={24} w={90} r="9999px" />
            <S h={24} w={140} r="9999px" delay="0.06s" />
          </div>
        </div>
      </div>

      {/* Stats grid (3 col) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "0.75rem",
        marginBottom: "1.5rem",
      }}>
        {[...Array(3)].map((_, i) => (
          <S key={i} h={80} r="1rem" delay={`${i * 0.1}s`} />
        ))}
      </div>

      {/* Credits card */}
      <div style={{
        borderRadius: "1.25rem",
        background: "var(--ghost-bg)",
        border: "1px solid var(--border-default)",
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
        marginBottom: "1rem",
      }}>
        <S h={48} w={48} r="0.75rem" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <S h={16} w={180} mb="0.35rem" />
          <S h={13} w={120} />
        </div>
        <S h={44} w={110} r="0.75rem" style={{ flexShrink: 0 }} />
      </div>

      {/* Connected platforms card */}
      <S h={120} r="1.25rem" mb="1rem" />

      {/* Quick links card */}
      <div style={{
        borderRadius: "1.25rem",
        background: "var(--ghost-bg)",
        border: "1px solid var(--border-default)",
        padding: "1.5rem",
      }}>
        <S h={14} w={100} mb="1rem" />
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ borderBottom: i < 3 ? "1px solid var(--border-default)" : undefined }}>
            <S h={52} r="0.5rem" mb={i < 3 ? "0.125rem" : undefined} delay={`${i * 0.08}s`} />
          </div>
        ))}
      </div>
    </div>
  );
}
