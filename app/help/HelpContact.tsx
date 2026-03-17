export default function HelpContact() {
  return (
    <div
      className="card"
      style={{ padding: "2rem", textAlign: "center" }}
    >
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.25rem",
        }}
      >
        Still need help?
      </h3>
      <p
        style={{
          fontSize: "0.85rem",
          color: "var(--text-muted)",
          marginBottom: "1.5rem",
        }}
      >
        Our support team is available Mon&ndash;Sat, 8am&ndash;8pm EST.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "1.5rem",
        }}
      >
        {/* Phone */}
        <a
          href="tel:5127580518"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            color: "var(--accent)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: "1.15rem" }}>📞</span>
          (512) 758-0518
        </a>

        {/* Email */}
        <a
          href="mailto:legacyloopmaine@gmail.com"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            color: "var(--accent)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: "1.15rem" }}>✉️</span>
          legacyloopmaine@gmail.com
        </a>

        {/* Text */}
        <a
          href="sms:5127580518"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            color: "var(--accent)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: "1.15rem" }}>💬</span>
          Text Us
        </a>
      </div>
    </div>
  );
}
