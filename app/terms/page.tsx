import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | LegacyLoop",
  description: "Terms and conditions for using the LegacyLoop estate resale platform.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl card p-8">
      <div className="section-title">Legal</div>
      <h1 className="h1 mt-2">Terms of Service</h1>
      <p className="muted mt-2">Last updated: March 2, 2026</p>

      <div className="mt-8 space-y-6" style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using LegacyLoop, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>2. Service Description</h2>
          <p className="mt-2">
            LegacyLoop provides AI-powered item identification, pricing estimates, and marketplace tools for estate sales and resale markets. Our platform connects sellers with potential buyers and provides tools for listing, pricing, and managing items.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>3. Pricing Estimates</h2>
          <p className="mt-2">
            All pricing estimates provided by LegacyLoop are for informational purposes only. Estimates are generated using AI analysis, market comparable data, and algorithmic models. Actual sale prices may vary significantly. LegacyLoop does not guarantee any specific sale price or outcome.
          </p>
          <p className="mt-2">
            For antique or high-value items, we recommend obtaining a professional appraisal before making selling decisions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>4. User Responsibilities</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Provide accurate descriptions and photos of items</li>
            <li>Comply with all applicable laws regarding the sale of goods</li>
            <li>Not list prohibited, stolen, or counterfeit items</li>
            <li>Maintain the security of your account credentials</li>
            <li>Respond to buyer inquiries in good faith</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>5. Fees and Commissions</h2>
          <p className="mt-2">
            LegacyLoop offers tiered subscription plans and credit-based services. Current pricing is available on our <a href="/pricing" style={{ color: "var(--accent)" }}>pricing page</a>. Commission rates vary by subscription tier and are disclosed before any transaction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>6. Intellectual Property</h2>
          <p className="mt-2">
            You retain ownership of all photos and content you upload. By uploading content, you grant LegacyLoop a non-exclusive license to use, display, and process your content for platform functionality including AI analysis and marketplace display.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>7. Limitation of Liability</h2>
          <p className="mt-2">
            LegacyLoop is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of our platform, including but not limited to inaccurate pricing estimates, failed transactions, or data loss.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>8. Termination</h2>
          <p className="mt-2">
            Either party may terminate this agreement at any time. Upon termination, your right to use the platform ceases. We may retain anonymized data for analytical purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>9. Contact</h2>
          <p className="mt-2">
            Questions about these terms? Contact us at{" "}
            <a href="mailto:legal@legacyloop.com" style={{ color: "var(--accent)" }}>legal@legacyloop.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
