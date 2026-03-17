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
      <p className="muted mt-2">Last updated: March 2, 2026</p>

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
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>7. Contact</h2>
          <p className="mt-2">
            For privacy-related questions or requests, contact us at{" "}
            <a href="mailto:privacy@legacyloop.com" style={{ color: "var(--accent)" }}>privacy@legacyloop.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
