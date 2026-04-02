import type { Metadata } from "next";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy · LegacyLoop",
  description:
    "How LegacyLoop collects, uses, and protects your personal information. GDPR, CCPA, and Meta Platform compliant.",
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1rem" }}>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
      />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div
          style={{
            width: 48,
            height: 3,
            background:
              "linear-gradient(90deg, var(--accent), var(--accent-deep))",
            borderRadius: 2,
            margin: "0 auto 1rem auto",
          }}
        />
        <h1
          style={{
            fontSize: "1.85rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.88rem",
          }}
        >
          Effective: March 2026 · Last updated: March 2026
        </p>
      </div>

      {/* 1. Introduction */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          1. Introduction
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.75rem",
          }}
        >
          LegacyLoop (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          operates the LegacyLoop platform accessible at legacy-loop.com (the
          &ldquo;Service&rdquo;). We are committed to protecting your personal
          information and your right to privacy.
        </p>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          This Privacy Policy explains what information we collect, how we use
          it, and what rights you have in relation to it. Please read it
          carefully. If you disagree with its terms, please discontinue use of
          our Service.
        </p>
      </div>

      {/* 2. Information We Collect */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          2. Information We Collect
        </h2>

        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--accent)",
            marginBottom: "0.5rem",
          }}
        >
          Information You Provide
        </h3>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
            marginBottom: "0.75rem",
          }}
        >
          <li>
            <strong>Account registration:</strong> Name, email address, and
            password
          </li>
          <li>
            <strong>Profile information:</strong> Display name, location, and
            preferences
          </li>
          <li>
            <strong>Item listings:</strong> Photos, descriptions, condition
            notes, and pricing information
          </li>
          <li>
            <strong>Communications:</strong> Messages sent through the platform,
            support inquiries, and feedback
          </li>
          <li>
            <strong>Payment information:</strong> Processed securely via Square
            &mdash; we do not store your credit card details
          </li>
        </ul>

        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--accent)",
            marginBottom: "0.5rem",
            marginTop: "0.75rem",
          }}
        >
          Information Collected Automatically
        </h3>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
            marginBottom: "0.75rem",
          }}
        >
          <li>Device and browser information</li>
          <li>IP address</li>
          <li>Pages visited and features used</li>
          <li>Referring URLs</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>

        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--accent)",
            marginBottom: "0.5rem",
            marginTop: "0.75rem",
          }}
        >
          Information from Third Parties
        </h3>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>
            <strong>Facebook / Instagram:</strong> Basic profile information and
            page details (when you connect your account)
          </li>
          <li>
            <strong>eBay:</strong> Listing and pricing data for market
            comparables
          </li>
          <li>
            <strong>Square:</strong> Payment confirmation and transaction status
          </li>
        </ul>
      </div>

      {/* 3. How We Use Your Information */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          3. How We Use Your Information
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.5rem",
          }}
        >
          We use the information we collect to:
        </p>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>Provide, operate, and maintain the platform</li>
          <li>Process transactions and send related information</li>
          <li>
            Send you notifications about your account, listings, and buyer
            activity
          </li>
          <li>Improve and personalize your experience</li>
          <li>Understand how users interact with the platform</li>
          <li>Develop new features, products, and services</li>
          <li>
            Communicate with you for customer support and marketing purposes
            (with your consent)
          </li>
          <li>Process payments and prevent fraudulent transactions</li>
          <li>Comply with legal obligations</li>
        </ul>
      </div>

      {/* 4. Sharing Your Information */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          4. Sharing Your Information
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.75rem",
            fontWeight: 600,
          }}
        >
          We do not sell your personal information.
        </p>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.5rem",
          }}
        >
          We may share your information in the following limited circumstances:
        </p>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>
            <strong>Service providers:</strong> Square (payments), Resend
            (email), Shippo (shipping), and Supabase (infrastructure) &mdash;
            only as necessary to provide the Service
          </li>
          <li>
            <strong>Platform integrations:</strong> Facebook, Instagram, eBay,
            and other platforms you explicitly authorize
          </li>
          <li>
            <strong>Legal requirements:</strong> When required by law, subpoena,
            or government request
          </li>
          <li>
            <strong>Business transfers:</strong> In connection with a merger,
            acquisition, or sale of assets
          </li>
        </ul>
      </div>

      {/* 5. Data Retention */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          5. Data Retention
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          We retain your personal information for as long as your account is
          active or as needed to provide the Service. You may request deletion of
          your data at any time (see Section 9). We may retain certain
          information as required by law or for legitimate business purposes such
          as fraud prevention.
        </p>
      </div>

      {/* 6. Cookies */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          6. Cookies
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.5rem",
          }}
        >
          LegacyLoop uses the following types of cookies:
        </p>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>
            <strong>Essential cookies:</strong> Required for authentication and
            security (e.g., JWT session token)
          </li>
          <li>
            <strong>Analytics cookies:</strong> Help us understand how the
            platform is used (aggregated and anonymized)
          </li>
          <li>
            <strong>Preference cookies:</strong> Remember your settings such as
            theme choice (light/dark/auto) and layout preferences
          </li>
        </ul>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginTop: "0.75rem",
          }}
        >
          You can control cookies through your browser settings. Disabling
          essential cookies will prevent you from logging in.
        </p>
      </div>

      {/* 7. Facebook and Meta Platform */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          7. Facebook and Meta Platform
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.75rem",
          }}
        >
          If you connect your Facebook or Instagram account to LegacyLoop, we
          access only the permissions you explicitly grant.
        </p>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.75rem",
            fontWeight: 600,
            fontStyle: "italic",
          }}
        >
          Our use of information received from Meta APIs complies with
          Meta&apos;s Platform Terms and Developer Policies.
        </p>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>
            We only access permissions you explicitly grant during the
            connection flow
          </li>
          <li>
            Data received from Meta is used solely for posting listings on your
            behalf and displaying marketplace information
          </li>
          <li>
            We do not access your personal messages or friends list
          </li>
          <li>
            You can revoke LegacyLoop&apos;s access at any time via Facebook
            Settings &rarr; Apps and Websites
          </li>
        </ul>
      </div>

      {/* 8. Your Privacy Rights */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          8. Your Privacy Rights
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.5rem",
          }}
        >
          Depending on your location, you may have the following rights
          regarding your personal data:
        </p>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>
            <strong>Access:</strong> Request a copy of the personal data we hold
            about you
          </li>
          <li>
            <strong>Correction:</strong> Request correction of inaccurate or
            incomplete data
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your personal data
          </li>
          <li>
            <strong>Portability:</strong> Request a portable copy of your data in
            a structured, machine-readable format
          </li>
          <li>
            <strong>Objection:</strong> Object to certain processing of your
            personal data
          </li>
          <li>
            <strong>Restriction:</strong> Request that we limit how we use your
            data
          </li>
        </ul>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginTop: "0.75rem",
          }}
        >
          To exercise any of these rights, contact us at{" "}
          <a
            href="mailto:hello@legacy-loop.com"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            hello@legacy-loop.com
          </a>
          .
        </p>
      </div>

      {/* 9. Data Deletion */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          9. Data Deletion
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.5rem",
          }}
        >
          To request deletion of your data:
        </p>
        <ol
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
            marginBottom: "0.75rem",
          }}
        >
          <li>
            Send an email to{" "}
            <a
              href="mailto:hello@legacy-loop.com"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              hello@legacy-loop.com
            </a>{" "}
            with the subject &ldquo;Data Deletion Request&rdquo;
          </li>
          <li>Include your full name and the email address associated with your account</li>
          <li>We will confirm receipt within 5 business days</li>
          <li>All personal data will be permanently deleted within 30 days</li>
          <li>A confirmation email will be sent upon completion</li>
        </ol>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          You can also submit a deletion request via our{" "}
          <a
            href="/data-deletion"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            Data Deletion page
          </a>
          .
        </p>
      </div>

      {/* 10. Children's Privacy */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          10. Children&apos;s Privacy
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          Our Service is not intended for individuals under the age of 13. We do
          not knowingly collect personal information from children under 13. If
          you become aware that a child has provided us with personal data,
          please contact us immediately at{" "}
          <a
            href="mailto:hello@legacy-loop.com"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            hello@legacy-loop.com
          </a>{" "}
          and we will take steps to delete such information.
        </p>
      </div>

      {/* 11. Security */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          11. Security
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          We implement commercially reasonable security measures to protect your
          personal information, including encrypted password storage (bcrypt),
          HTTPS encryption, secure JWT tokens, and role-based access controls.
          However, no method of transmission over the Internet or electronic
          storage is 100% secure, and we cannot guarantee absolute security.
        </p>
      </div>

      {/* 12. Changes to This Policy */}
      <div
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          12. Changes to This Policy
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          We may update this Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page and
          updating the &ldquo;Last updated&rdquo; date at the top. You are
          advised to review this Privacy Policy periodically for any changes.
        </p>
      </div>

      {/* 13. Contact Us */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(0,188,212,0.02))",
          border: "1px solid rgba(0,188,212,0.2)",
          borderRadius: "16px",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          13. Contact Us
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.25rem",
          }}
        >
          Email:{" "}
          <a
            href="mailto:hello@legacy-loop.com"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            hello@legacy-loop.com
          </a>{" "}
          /{" "}
          <a
            href="mailto:support@legacy-loop.com"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            support@legacy-loop.com
          </a>
        </p>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.25rem",
          }}
        >
          Website:{" "}
          <a
            href="https://legacy-loop.com"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            legacy-loop.com
          </a>
        </p>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          Mailing: LegacyLoop, Maine, USA
        </p>
      </div>
    </div>
  );
}
