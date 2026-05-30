import type { Metadata } from "next";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Data Deletion Status — Legacy-Loop",
  description:
    "Check the status of a Facebook / Instagram data deletion request using your confirmation code.",
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  backdropFilter: "blur(16px)",
  border: "1px solid var(--border-default)",
  borderRadius: "16px",
  padding: "1.5rem",
  marginBottom: "1rem",
  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
};

const bodyStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "var(--text-secondary)",
  lineHeight: 1.7,
};

// Confirmation codes are issued as "del_" + 24 hex chars by the deletion callback.
function isValidCode(code: string): boolean {
  return /^del_[a-f0-9]{24}$/.test(code);
}

export default async function DataDeletionStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; id?: string }>;
}) {
  const params = await searchParams;
  const code = (params.code ?? params.id ?? "").trim();
  const hasValidCode = code.length > 0 && isValidCode(code);

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1rem" }}>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Data Deletion Status" }]}
      />

      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div
          style={{
            width: 48,
            height: 3,
            background: "linear-gradient(90deg, var(--accent), var(--accent-deep))",
            borderRadius: 2,
            margin: "0 auto 1rem auto",
          }}
        />
        <h1
          style={{
            fontSize: "1.85rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          Data Deletion Status
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
          Track a Facebook or Instagram data deletion request.
        </p>
      </div>

      {hasValidCode ? (
        <div style={cardStyle}>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--success)",
              marginBottom: "0.75rem",
            }}
          >
            Deletion request received
          </h2>
          <p style={{ ...bodyStyle, marginBottom: "0.75rem" }}>
            Your confirmation code:
          </p>
          <p
            style={{
              fontFamily: "var(--font-data)",
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              background: "var(--ghost-bg)",
              border: "1px solid var(--border-default)",
              borderRadius: "0.6rem",
              padding: "0.75rem 1rem",
              wordBreak: "break-all",
              marginBottom: "1rem",
            }}
          >
            {code}
          </p>
          <p style={{ ...bodyStyle, marginBottom: "0.5rem" }}>
            We have removed the data associated with your Facebook / Instagram
            connection &mdash; including login profile data, connected Page and
            Instagram details, and Messenger conversation logs. Any data we are
            legally required to retain (for example, transaction records) is
            described on our{" "}
            <a
              href="/data-deletion"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              Data Deletion
            </a>{" "}
            page.
          </p>
          <p style={bodyStyle}>
            Full removal completes within 30 days. Questions? Email{" "}
            <a
              href="mailto:privacy@legacy-loop.com"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              privacy@legacy-loop.com
            </a>
            .
          </p>
        </div>
      ) : (
        <div style={cardStyle}>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "0.75rem",
            }}
          >
            {code.length > 0 ? "Code not recognized" : "Check your status"}
          </h2>
          <p style={{ ...bodyStyle, marginBottom: "0.5rem" }}>
            {code.length > 0
              ? "That confirmation code does not match our format. Please re-check the code Facebook gave you."
              : "When you remove Legacy-Loop from Facebook, you receive a confirmation code. Open this page with that code (for example, /data-deletion-status?code=del_…) to confirm your request."}
          </p>
          <p style={bodyStyle}>
            You can also start a deletion request on our{" "}
            <a
              href="/data-deletion"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              Data Deletion
            </a>{" "}
            page, or email{" "}
            <a
              href="mailto:privacy@legacy-loop.com"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              privacy@legacy-loop.com
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
