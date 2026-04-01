import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion — LegacyLoop",
  description: "Request deletion of your personal data from LegacyLoop. GDPR, CCPA, and Meta Platform Policy compliant.",
};

export default function DataDeletionPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Premium header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem", position: "relative" }}>
        <div style={{ position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)", width: "300px", height: "200px", background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,188,212,0.08), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ width: 48, height: 3, background: "linear-gradient(90deg, #00bcd4, #009688)", borderRadius: 2, margin: "0 auto 1rem auto" }} />
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.02em", backgroundImage: "linear-gradient(135deg, var(--text-primary), #00bcd4)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>Data Deletion Request</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>Your data, your control. We make deletion simple.</p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.5rem" }}>Last updated: March 2026</p>
      </div>

      {/* Glass cards for each section */}

      {/* Section 1: Your Right to Deletion */}
      <div style={{ background: "var(--bg-card)", backdropFilter: "blur(16px)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>Your Right to Deletion</h2>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          LegacyLoop respects your right to have your personal data deleted. This right is protected under the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and Meta Platform Policy. You can request complete deletion of your account and all associated data at any time.
        </p>
      </div>

      {/* Section 2: How to Request */}
      <div style={{ background: "var(--bg-card)", backdropFilter: "blur(16px)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>How to Request Data Deletion</h2>

        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#00bcd4", marginBottom: "0.5rem" }}>Option 1: Email Request</h3>
          <ol style={{ paddingLeft: "1.25rem", fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li>Send an email to <a href="mailto:support@legacy-loop.com" style={{ color: "#00bcd4", textDecoration: "none" }}>support@legacy-loop.com</a></li>
            <li>Subject line: &ldquo;Data Deletion Request&rdquo;</li>
            <li>Include the email address associated with your LegacyLoop account</li>
            <li>Include any specific data you want deleted (or request full account deletion)</li>
            <li>We will confirm receipt within 5 business days</li>
          </ol>
        </div>

        <div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#00bcd4", marginBottom: "0.5rem" }}>Option 2: Account Settings</h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Log in to your LegacyLoop account, go to <strong>Settings</strong>, and select <strong>Delete My Account</strong>. Follow the confirmation steps. This initiates immediate deletion of your account and all associated data.
          </p>
        </div>
      </div>

      {/* Section 3: What Happens After */}
      <div style={{ background: "var(--bg-card)", backdropFilter: "blur(16px)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>What Happens After You Request Deletion</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.5rem", color: "#00bcd4", fontWeight: 700 }}>Timeline</th>
                <th style={{ textAlign: "left", padding: "0.5rem", color: "#00bcd4", fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}><td style={{ padding: "0.5rem", color: "var(--text-primary)", fontWeight: 600 }}>Within 5 business days</td><td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>We confirm receipt of your request</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}><td style={{ padding: "0.5rem", color: "var(--text-primary)", fontWeight: 600 }}>Within 30 days</td><td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>All personal data is permanently deleted from our systems</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}><td style={{ padding: "0.5rem", color: "var(--text-primary)", fontWeight: 600 }}>Within 30 days</td><td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>Data shared with Meta (Facebook/Instagram) is removed</td></tr>
              <tr><td style={{ padding: "0.5rem", color: "var(--text-primary)", fontWeight: 600 }}>After completion</td><td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>Confirmation email sent to your registered email address</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Data We May Retain */}
      <div style={{ background: "var(--bg-card)", backdropFilter: "blur(16px)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>Data We May Retain</h2>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.5rem" }}>In limited circumstances, we may retain certain data as required by law:</p>
        <ul style={{ paddingLeft: "1.25rem", fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
          <li><strong>Legal requirements:</strong> Transaction records required for tax/financial reporting</li>
          <li><strong>Fraud prevention:</strong> Data needed to prevent fraud or enforce our Terms of Service</li>
          <li><strong>Anonymized data:</strong> Aggregated, anonymized analytics data that cannot identify you</li>
        </ul>
      </div>

      {/* Section 5: Facebook and Instagram Data */}
      <div style={{ background: "var(--bg-card)", backdropFilter: "blur(16px)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>Facebook and Instagram Data</h2>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.5rem" }}>If you connected your Facebook or Instagram account to LegacyLoop, we will remove all data obtained through those connections within 30 days of your deletion request. You can also remove LegacyLoop&apos;s access directly:</p>
        <ol style={{ paddingLeft: "1.25rem", fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
          <li>Go to Facebook Settings → Apps and Websites</li>
          <li>Find &ldquo;LegacyLoop&rdquo; in the list</li>
          <li>Click &ldquo;Remove&rdquo; to revoke access</li>
        </ol>
      </div>

      {/* Contact */}
      <div style={{ background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(0,188,212,0.02))", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "16px", padding: "1.5rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Contact Us</h2>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          Questions about data deletion? Contact us at{" "}
          <a href="mailto:support@legacy-loop.com" style={{ color: "#00bcd4", textDecoration: "none" }}>support@legacy-loop.com</a>
        </p>
      </div>
    </div>
  );
}
