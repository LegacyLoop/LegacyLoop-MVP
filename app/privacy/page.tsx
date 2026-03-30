import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | LegacyLoop",
  description: "How LegacyLoop collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl card p-8">
      <div className="section-title">Legal</div>
      <h1 className="h1 mt-2">Privacy Policy</h1>
      <p className="muted mt-2">Last updated: March 2026</p>

      <div className="mt-8 space-y-6" style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>1. Information We Collect</h2>
          <p className="mt-2">
            <strong>Account Information:</strong> Email address and encrypted password when you create an account.
          </p>
          <p className="mt-2">
            <strong>Item Data:</strong> Photos, descriptions, condition notes, pricing information, and location (ZIP code) you provide for items you list.
          </p>
          <p className="mt-2">
            <strong>Usage Data:</strong> Pages visited, features used, and interactions with our AI tools to improve service quality.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>2. How We Use Your Information</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Provide AI-powered item identification and pricing estimates</li>
            <li>Connect sellers with potential buyers</li>
            <li>Improve our pricing algorithms and AI models</li>
            <li>Send service-related communications</li>
            <li>Prevent fraud and ensure platform security</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>3. Third-Party Services</h2>
          <p className="mt-2">
            We use the following third-party services to provide our platform:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>OpenAI:</strong> AI-powered item identification and pricing analysis</li>
            <li><strong>Anthropic:</strong> Multi-AI consensus pricing (MegaBot)</li>
            <li><strong>Google Gemini:</strong> Multi-AI consensus pricing (MegaBot)</li>
            <li><strong>Shippo:</strong> Shipping rate calculations and label generation</li>
            <li><strong>eBay Browse API:</strong> Live market comparable pricing data</li>
          </ul>
          <p className="mt-2">
            Item photos are sent to AI providers for analysis. We do not sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>4. Data Retention</h2>
          <p className="mt-2">
            Your account data and item listings are retained as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>5. Your Rights</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate information</li>
            <li><strong>Deletion:</strong> Request removal of your data</li>
            <li><strong>Portability:</strong> Export your item data</li>
            <li><strong>Opt-out:</strong> Withdraw consent for data sharing at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>6. Security</h2>
          <p className="mt-2">
            We use industry-standard security measures including encrypted passwords (bcrypt), secure JWT tokens, and HTTPS encryption in production. Item photos are stored securely and only accessible to you and authorized platform services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>7. Payment Processing</h2>
          <p className="mt-2">
            Payments are processed by Square, Inc. We do not store your full credit card number. Square processes and stores payment information in accordance with PCI-DSS standards. When you make a purchase, Square collects your payment details directly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>8. Facebook & Instagram (Meta) Data</h2>
          <p className="mt-2">
            If you connect your Facebook or Instagram account to LegacyLoop, we may access your public profile information and Marketplace listings as permitted by Meta Platform Policy. We do not post on your behalf without explicit permission. You can revoke access at any time via Facebook Settings → Apps and Websites.
          </p>
        </section>

        <section id="cookies">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>9. Cookies</h2>
          <p className="mt-2">LegacyLoop uses the following types of cookies:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Essential cookies:</strong> Required for authentication and security (JWT session token)</li>
            <li><strong>Preference cookies:</strong> Remember your theme choice (light/dark/auto) and panel layout</li>
            <li><strong>Analytics cookies:</strong> Help us understand how the platform is used (aggregated, anonymized)</li>
          </ul>
          <p className="mt-2">You can disable non-essential cookies in your browser settings. Disabling essential cookies will prevent you from logging in.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>10. Data Deletion</h2>
          <p className="mt-2">
            You can request complete deletion of your account and all associated data. Visit our{" "}
            <a href="/data-deletion" style={{ color: "var(--accent)" }}>Data Deletion page</a>{" "}
            for full instructions. We comply with GDPR and CCPA deletion requirements within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>11. Contact</h2>
          <p className="mt-2">
            For privacy-related questions or requests, contact us at{" "}
            <a href="mailto:support@legacy-loop.com" style={{ color: "var(--accent)" }}>support@legacy-loop.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
