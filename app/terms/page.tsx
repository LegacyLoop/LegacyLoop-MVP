import type { Metadata } from "next";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Service · LegacyLoop",
  description:
    "Terms and conditions for using the LegacyLoop AI-powered estate resale platform.",
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1rem" }}>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]}
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
          Terms of Service
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

      {/* 1. Acceptance of Terms */}
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
          1. Acceptance of Terms
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          By accessing or using the LegacyLoop platform (&ldquo;Service&rdquo;),
          you agree to be bound by these Terms of Service
          (&ldquo;Terms&rdquo;). If you do not agree to all of these Terms,
          please do not use our Service. These Terms constitute a legally binding
          agreement between you and LegacyLoop (&ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
        </p>
      </div>

      {/* 2. Description of Service */}
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
          2. Description of Service
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.5rem",
          }}
        >
          LegacyLoop is an AI-powered estate resale platform that provides:
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
            AI-powered item identification and analysis using computer vision
          </li>
          <li>
            Market-based pricing intelligence with live comparable data
          </li>
          <li>Antique and collectible detection and appraisal recommendations</li>
          <li>Buyer matching and lead generation tools</li>
          <li>
            Buyer Intent Scanner — opt-in, consent-based scanning of publicly
            visible social media posts and classifieds to match buyer intent with
            your inventory (no audio recording, no microphone access, no background
            monitoring)
          </li>
          <li>Multi-platform listing and marketplace integration</li>
          <li>Shipping calculation, label generation, and tracking</li>
          <li>Estate sale project management and organization tools</li>
          <li>
            Optional data sharing program with transparent consent controls and
            credit incentives (see Privacy Policy for details)
          </li>
        </ul>
      </div>

      {/* 3. User Accounts */}
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
          3. User Accounts
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.5rem",
          }}
        >
          To use certain features of the Service, you must create an account. By
          creating an account, you agree that:
        </p>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>You are at least 18 years of age</li>
          <li>
            You will provide accurate, current, and complete information during
            registration
          </li>
          <li>
            You will maintain the security of your password and account
            credentials
          </li>
          <li>
            You are responsible for all activity that occurs under your account
          </li>
          <li>
            You will notify us immediately of any unauthorized use of your
            account
          </li>
        </ul>
      </div>

      {/* 4. Pricing & Fees */}
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
          4. Pricing and Fees
        </h2>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>
            <strong>AI pricing estimates are informational only</strong> and do
            not constitute a professional appraisal or guarantee of sale price.
            For antique or high-value items, we recommend obtaining a
            professional appraisal.
          </li>
          <li>
            <strong>Subscription plans</strong> are billed monthly or annually.
            Current pricing is available on our{" "}
            <a
              href="/pricing"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              pricing page
            </a>
            .
          </li>
          <li>
            <strong>Commission rates</strong> vary by subscription tier and are
            disclosed before any transaction is completed.
          </li>
          <li>
            <strong>Processing fees</strong> (3.5%) are charged to the buyer, not
            the seller.
          </li>
          <li>
            All fees and commission rates are subject to change with 30 days
            notice.
          </li>
        </ul>
      </div>

      {/* 5. User Content */}
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
          5. User Content
        </h2>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>
            You retain all intellectual property rights to photos, descriptions,
            and other content you upload to the platform.
          </li>
          <li>
            By uploading content, you grant LegacyLoop a non-exclusive,
            worldwide, royalty-free license to use, display, reproduce, and
            process your content for the purpose of providing the Service,
            including AI analysis and marketplace display.
          </li>
          <li>
            You are solely responsible for the accuracy and legality of all
            content you submit.
          </li>
          <li>
            We reserve the right to remove any content that violates these Terms
            or applicable law.
          </li>
        </ul>
      </div>

      {/* 6. Prohibited Conduct */}
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
          6. Prohibited Conduct
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.5rem",
          }}
        >
          You agree not to:
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
            Engage in fraud, misrepresentation, or deceptive practices
          </li>
          <li>
            List stolen, counterfeit, prohibited, or illegal items
          </li>
          <li>
            Circumvent or attempt to circumvent platform fees or commissions
          </li>
          <li>Harass, threaten, or abuse other users</li>
          <li>
            Scrape, crawl, or use automated means to access the platform without
            authorization
          </li>
          <li>
            Interfere with or disrupt the Service or its infrastructure
          </li>
          <li>
            Create multiple accounts to evade bans or manipulate the platform
          </li>
          <li>
            Use the Service for any purpose that violates applicable local,
            state, national, or international law
          </li>
        </ul>
      </div>

      {/* 7. Payment Terms */}
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
          7. Payment Terms
        </h2>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>
            All payments are processed securely through Square, Inc. in
            accordance with PCI-DSS standards.
          </li>
          <li>
            A 3.5% processing fee is applied to the buyer on each transaction.
          </li>
          <li>
            Seller commissions are deducted from the sale price according to your
            subscription tier before payout.
          </li>
          <li>
            Credit purchases are non-refundable once credits have been applied to
            your account.
          </li>
          <li>
            Subscription fees are billed in advance and are non-refundable for
            the current billing period.
          </li>
          <li>
            We reserve the right to suspend or terminate accounts with
            outstanding balances.
          </li>
        </ul>
      </div>

      {/* 8. Privacy */}
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
          8. Privacy
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.75rem",
          }}
        >
          Your use of the Service is also governed by our{" "}
          <a
            href="/privacy"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            Privacy Policy
          </a>
          , which is incorporated into these Terms by reference.
        </p>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            fontWeight: 600,
            fontStyle: "italic",
          }}
        >
          Our use of information received from Meta APIs complies with
          Meta&apos;s Platform Terms and Developer Policies.
        </p>
      </div>

      {/* 9. Intellectual Property */}
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
          9. Intellectual Property
        </h2>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>
            The LegacyLoop platform, including its design, code, AI models,
            analysis algorithms, branding, and all related intellectual property,
            is owned by LegacyLoop and protected by applicable copyright,
            trademark, and other intellectual property laws.
          </li>
          <li>
            AI-generated analysis outputs, pricing estimates, and market reports
            produced by the platform are the property of LegacyLoop.
          </li>
          <li>
            You may not copy, modify, distribute, sell, or lease any part of our
            Service or its content without our written consent.
          </li>
          <li>
            The LegacyLoop name, logo, and all related names, logos, and
            slogans are trademarks of LegacyLoop.
          </li>
        </ul>
      </div>

      {/* 10. Limitation of Liability */}
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
          10. Limitation of Liability
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "0.75rem",
          }}
        >
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; without warranties of any kind, either express or
          implied.
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
            <strong>AI pricing estimates do not constitute a professional
            appraisal.</strong> Actual sale prices may vary significantly from
            estimates provided by the platform.
          </li>
          <li>
            We are not responsible for the outcome of any sale, the accuracy of
            buyer offers, or disputes between buyers and sellers.
          </li>
          <li>
            To the maximum extent permitted by law, LegacyLoop shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages arising from or related to your use of the Service.
          </li>
          <li>
            Our total liability for any claims arising from or related to these
            Terms or the Service shall not exceed the total fees you have paid to
            LegacyLoop in the twelve (12) months preceding the claim.
          </li>
        </ul>
      </div>

      {/* 11. Indemnification */}
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
          11. Indemnification
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          You agree to indemnify, defend, and hold harmless LegacyLoop, its
          officers, directors, employees, and agents from and against any and all
          claims, liabilities, damages, losses, costs, and expenses (including
          reasonable attorneys&apos; fees) arising from or related to: (a) your
          use of the Service; (b) your violation of these Terms; (c) your
          violation of any third-party rights; or (d) any content you submit to
          the platform.
        </p>
      </div>

      {/* 12. Termination */}
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
          12. Termination
        </h2>
        <ul
          style={{
            paddingLeft: "1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
          }}
        >
          <li>
            Either party may terminate this agreement at any time. You may close
            your account via account settings or by contacting us.
          </li>
          <li>
            We may suspend or terminate your account if you violate these Terms
            or engage in prohibited conduct.
          </li>
          <li>
            Upon termination, your right to use the Service ceases immediately.
          </li>
          <li>
            You may request deletion of your data per our{" "}
            <a
              href="/data-deletion"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              Data Deletion
            </a>{" "}
            process.
          </li>
          <li>
            Sections that by their nature should survive termination (including
            Limitation of Liability, Indemnification, and Governing Law) will
            survive.
          </li>
        </ul>
      </div>

      {/* 13. Changes to Terms */}
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
          13. Changes to Terms
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          We reserve the right to modify these Terms at any time. We will notify
          you of material changes by posting the updated Terms on this page and
          updating the &ldquo;Last updated&rdquo; date. Your continued use of
          the Service after any changes constitutes acceptance of the new Terms.
        </p>
      </div>

      {/* 14. Governing Law */}
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
          14. Governing Law
        </h2>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          These Terms shall be governed by and construed in accordance with the
          laws of the State of Maine, United States, without regard to its
          conflict of law provisions. Any disputes arising from or related to
          these Terms or the Service shall be resolved in the state or federal
          courts located in the State of Maine.
        </p>
      </div>

      {/* 15. Contact Us */}
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
          15. Contact Us
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
