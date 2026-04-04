"use client";
import { useState } from "react";

interface ReferralRow {
  id: string;
  referredEmail: string | null;
  status: string;
  rewardCredits: number;
  createdAt: string;
  usedAt: string | null;
}

interface Props {
  code: string;
  shareUrl: string;
  referrals: ReferralRow[];
}

export default function ReferralClient({ code, shareUrl, referrals }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmail() {
    const subject = encodeURIComponent("Join me on LegacyLoop — AI estate sales");
    const body = encodeURIComponent(
      `Hey!\n\nI've been using LegacyLoop to sell estate items with AI — it's been amazing.\n\nUse my referral link to sign up and we both get 50 free credits:\n${shareUrl}\n\nCode: ${code}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  const completed = referrals.filter((r) => r.status === "USED");
  const creditsEarned = completed.reduce((s, r) => s + r.rewardCredits, 0);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div style={{ padding: "3px", borderRadius: "1.5rem", background: "linear-gradient(135deg, var(--accent), #7c3aed, #a855f7)" }}>
        <div style={{ background: "var(--bg-card-solid)", borderRadius: "calc(1.5rem - 3px)", padding: "2.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem" }}>🎁</div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.5rem", color: "var(--text-primary)" }}>Earn 💎 50 Credits Per Referral</h2>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
            Share LegacyLoop with friends and family. When they sign up, you both get 50 credits.
          </p>
        </div>
      </div>

      {/* Your code card */}
      <div className="card p-6">
        <div className="section-title mb-4">Your Referral Code</div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, background: "var(--ghost-bg)", border: "2px solid var(--accent)", borderRadius: "0.75rem", padding: "1rem 1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "0.2em", color: "var(--accent)", fontFamily: "monospace" }}>
              {code}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Your unique referral code</div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleCopy}
              className="btn-primary"
              style={{
                background: copied ? "#16a34a" : undefined,
                padding: "0.65rem 1.5rem", fontWeight: 700, fontSize: "0.9rem",
                transition: "background 0.2s",
              }}
            >
              {copied ? "✓ Copied!" : "📋 Copy Link"}
            </button>
            <button
              onClick={handleEmail}
              className="btn-ghost"
              style={{ padding: "0.65rem 1.5rem", fontWeight: 700, fontSize: "0.9rem" }}
            >
              ✉️ Share via Email
            </button>
          </div>
        </div>
        <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
          Share link: <span style={{ color: "var(--accent)" }}>{shareUrl}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Referrals Sent", value: referrals.length },
          { label: "Completed", value: completed.length },
          { label: "Credits Earned", value: creditsEarned || "—" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent)" }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card p-6">
        <div className="section-title mb-4">How It Works</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", icon: "🔗", title: "Share Your Link", desc: "Send your unique referral link to friends, family, or anyone who needs to sell estate items." },
            { step: "2", icon: "✅", title: "They Sign Up", desc: "Your friend creates their LegacyLoop account using your referral link or code." },
            { step: "3", icon: "💎", title: "Both Get Credits", desc: "You receive 50 credits. Your friend also gets 50 bonus credits to use on AI analysis, bots, and more." },
          ].map((s) => (
            <div key={s.step} style={{ background: "var(--bg-card-solid)", borderRadius: "0.75rem", padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem" }}>{s.icon}</div>
              <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>{s.title}</div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral history */}
      {referrals.length > 0 && (
        <div className="card p-6">
          <div className="section-title mb-4">Your Referrals</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Email</th>
                  <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Credits</th>
                  <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                    <td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>{r.referredEmail ?? "Pending"}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <span style={{
                        background: r.status === "USED" ? "#d1fae5" : "#fef3c7",
                        color: r.status === "USED" ? "#065f46" : "#92400e",
                        borderRadius: 9999, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700,
                      }}>
                        {r.status === "USED" ? "✓ Completed" : "Pending"}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem", color: r.status === "USED" ? "#065f46" : "#9ca3af", fontWeight: r.status === "USED" ? 700 : 400 }}>
                      {r.status === "USED" ? `+${r.rewardCredits}` : "—"}
                    </td>
                    <td style={{ padding: "0.5rem", color: "var(--text-muted)" }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="card p-6">
        <div className="section-title mb-4">FAQ</div>
        <div className="space-y-4">
          {[
            { q: "When do I get my credits?", a: "Credits are added to your account as soon as your referral completes their first sign-up. No purchase required." },
            { q: "Is there a limit on referrals?", a: "No limit! Refer as many people as you like. Each successful referral earns you 50 credits." },
            { q: "What can I do with credits?", a: "Credits can be used for AI analysis, MegaBuying Bot activations, priority processing, professional photos, and more services on the Credits page." },
          ].map((faq) => (
            <div key={faq.q} style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "1rem" }}>
              <div style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{faq.q}</div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
