"use client";

import { useState, useEffect } from "react";

/**
 * Buyer Intent Scanner — public-post-only intent detection
 *
 * This feature scans PUBLIC social media posts, buy/sell boards,
 * and classified ads to match buyer intent with your inventory.
 *
 * CRITICAL COMPLIANCE:
 * - NO audio recording, NO mic access, NO ambient capture
 * - Only analyzes publicly visible text from social platforms
 * - Consent persisted to DB via /api/consent
 * - Fully revocable — user can disable anytime
 * - Currently in DEMO MODE with simulated results
 */

type Match = {
  id: string;
  buyer: string;
  source: string;
  quote: string;
  confidence: number;
  matchedItem: string;
  matchedPrice: number;
};

const DEMO_MATCHES: Match[] = [
  {
    id: "m1",
    buyer: "Sarah M.",
    source: "Facebook Group · Waterville Buy Sell Trade",
    quote: "ISO vintage furniture for farmhouse bedroom, love that MCM look, willing to pay well",
    confidence: 92,
    matchedItem: "Mid-Century Modern Walnut Dresser",
    matchedPrice: 425,
  },
  {
    id: "m2",
    buyer: "r/Maine user",
    source: "Reddit · r/Maine",
    quote: "Looking for antique silverware set for estate gift, ideally pre-1900, budget $1,500+",
    confidence: 87,
    matchedItem: "Victorian Sterling Silver Tea Service",
    matchedPrice: 1800,
  },
  {
    id: "m3",
    buyer: "CL Wanted Post",
    source: "Craigslist · Augusta Wanted Ads",
    quote: "Need working typewriter any condition, portable preferred, willing to drive for right piece",
    confidence: 79,
    matchedItem: "Royal Quiet De Luxe Typewriter",
    matchedPrice: 265,
  },
];

const SCAN_STEPS = [
  "Scanning public buy/sell groups...",
  "Analyzing buyer intent signals...",
  "Matching to your inventory...",
  "3 matches found!",
];

export default function BuyerIntentScanner() {
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(-1);
  const [matches, setMatches] = useState<Match[]>([]);
  const [radius, setRadius] = useState(10);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [retention, setRetention] = useState(30);
  const [reached, setReached] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Check if user already has consent in DB
  useEffect(() => {
    fetch("/api/consent/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.dataCollection) {
          setConsentGiven(true);
        }
      })
      .catch(() => {});
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleConsentAccept() {
    setConsentLoading(true);
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataCollection: true,
          aiTraining: false,
          marketResearch: false,
          anonymousSharing: false,
        }),
      });
      setConsentGiven(true);
    } finally {
      setConsentLoading(false);
    }
  }

  async function handleRevokeConsent() {
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ declined: true }),
    });
    setConsentGiven(false);
    setEnabled(false);
    setMatches([]);
    showToast("Consent revoked. Scan data cleared.");
  }

  async function runScan() {
    setScanning(true);
    setMatches([]);
    setScanStep(0);
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 750));
      setScanStep(i);
    }
    await new Promise((r) => setTimeout(r, 400));
    setScanning(false);
    setMatches(DEMO_MATCHES);
  }

  function reachOut(matchId: string) {
    setReached((prev) => new Set([...prev, matchId]));
    showToast("Outreach queued — AI message being drafted!");
  }

  // ── Consent gate ──────────────────────────────────────────────────────────
  if (!consentGiven) {
    return (
      <div style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}>
        <div style={{
          background: "var(--bg-card-solid, #fff)",
          border: "1px solid var(--border-default, #e7e5e4)",
          borderRadius: "1.5rem",
          padding: "2rem",
          maxWidth: "540px",
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}>
          {/* Icon */}
          <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(0,188,212,0.1)",
              border: "2px solid rgba(0,188,212,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 0.75rem",
              fontSize: "1.75rem",
            }}>
              📡
            </div>
            <h1 style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary, #1c1917)",
            }}>
              Buyer Intent Scanner
            </h1>
            <p style={{
              color: "var(--text-secondary, #57534e)",
              marginTop: "0.5rem",
              fontSize: "0.88rem",
              lineHeight: 1.6,
            }}>
              LegacyLoop scans <strong>publicly visible</strong> social posts, buy/sell boards, and classified ads to find buyers already searching for items like yours.
            </p>
          </div>

          {/* How it works */}
          <div style={{
            marginTop: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}>
            {[
              {
                step: "1",
                title: "Public Post Analysis",
                desc: "AI reads publicly visible posts in buy/sell groups, Craigslist wanted ads, and Reddit boards",
              },
              {
                step: "2",
                title: "Semantic Matching",
                desc: "Matches buyer language to your listed inventory using AI similarity scoring",
              },
              {
                step: "3",
                title: "Instant Alert",
                desc: "You're notified with matched buyer details and a pre-written outreach message",
              },
            ].map((s) => (
              <div key={s.step} style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  background: "var(--accent, #00bcd4)",
                  color: "#fff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {s.step}
                </div>
                <div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: "var(--text-primary, #1c1917)",
                  }}>
                    {s.title}
                  </div>
                  <div style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted, #78716c)",
                    lineHeight: 1.4,
                  }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy guarantees */}
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "var(--ghost-bg, #f9f9f8)",
            borderRadius: "0.875rem",
          }}>
            <div style={{
              fontWeight: 700,
              fontSize: "0.82rem",
              color: "var(--text-primary, #1c1917)",
              marginBottom: "0.5rem",
            }}>
              🔒 Privacy & Compliance Guarantees
            </div>
            {[
              "Only analyzes publicly visible posts — never private messages or DMs",
              "No audio recording, microphone access, or ambient capture of any kind",
              "No background monitoring — scans run only when you press Scan",
              "All scan data is deleted after your chosen retention period",
              "You can revoke consent and delete all scan data at any time",
            ].map((p, i) => (
              <div key={i} style={{
                display: "flex",
                gap: "0.5rem",
                fontSize: "0.78rem",
                color: "var(--text-secondary, #44403c)",
                marginTop: "0.35rem",
                lineHeight: 1.4,
              }}>
                <span style={{ color: "var(--accent, #00bcd4)", flexShrink: 0 }}>✓</span>
                <span>{p}</span>
              </div>
            ))}
          </div>

          {/* Consent checkbox */}
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginTop: "1.25rem",
            cursor: "pointer",
            justifyContent: "center",
            fontSize: "0.82rem",
            color: "var(--text-secondary, #44403c)",
          }}>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "#00bcd4" }}
            />
            I understand this scans public posts only and agree to the terms
          </label>

          <button
            disabled={!consentChecked || consentLoading}
            onClick={handleConsentAccept}
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "0.85rem",
              background: consentChecked
                ? "linear-gradient(135deg, #00bcd4, #0097a7)"
                : "var(--ghost-bg, #e7e5e4)",
              color: consentChecked ? "#fff" : "var(--text-muted, #a8a29e)",
              border: "none",
              borderRadius: "0.75rem",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: consentChecked && !consentLoading ? "pointer" : "not-allowed",
              boxShadow: consentChecked ? "0 4px 16px rgba(0,188,212,0.25)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {consentLoading ? "Saving consent..." : "📡 Enable Buyer Intent Scanner"}
          </button>

          <div style={{
            textAlign: "center",
            marginTop: "0.75rem",
            fontSize: "0.68rem",
            color: "var(--text-muted, #a8a29e)",
            lineHeight: 1.5,
          }}>
            Consent is saved to your account and can be revoked anytime in Settings.
          </div>
        </div>
      </div>
    );
  }

  // ── Main interface ────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 100,
          background: "linear-gradient(135deg, #00bcd4, #0097a7)",
          color: "#fff",
          padding: "0.75rem 1.25rem",
          borderRadius: "0.75rem",
          fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          fontSize: "0.88rem",
        }}>
          {toast}
        </div>
      )}

      {/* Demo banner — honest, prominent */}
      <div style={{
        marginBottom: "1.5rem",
        padding: "0.75rem 1rem",
        background: "rgba(251,191,36,0.1)",
        border: "1px solid rgba(251,191,36,0.25)",
        borderRadius: "0.75rem",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
      }}>
        <span style={{
          padding: "0.15rem 0.5rem",
          background: "#fbbf24",
          color: "#78350f",
          borderRadius: "9999px",
          fontSize: "0.6rem",
          fontWeight: 900,
          letterSpacing: "0.1em",
        }}>
          DEMO
        </span>
        <span style={{
          fontSize: "0.8rem",
          color: "var(--text-secondary, #92400e)",
          fontWeight: 500,
          lineHeight: 1.4,
        }}>
          This feature displays <strong>simulated results</strong> for demonstration purposes. Production version will scan real public posts across connected platforms.
        </span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{
          fontSize: "0.65rem",
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.1em",
          color: "var(--accent, #00bcd4)",
        }}>
          Intelligence
        </div>
        <h1 style={{
          fontSize: "1.6rem",
          fontWeight: 900,
          color: "var(--text-primary, #1c1917)",
          marginTop: "0.35rem",
        }}>
          Buyer Intent Scanner
        </h1>
        <p style={{
          color: "var(--text-muted, #78716c)",
          fontSize: "0.88rem",
          marginTop: "0.25rem",
        }}>
          AI scans public posts to find buyers already searching for your items
        </p>
      </div>

      <div style={{ display: "grid", gap: "1.25rem" }}>
        <style>{`
          @media (min-width: 768px) {
            .intent-grid { grid-template-columns: 280px 1fr !important; }
          }
        `}</style>
        <div className="intent-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
          {/* Controls panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Enable toggle */}
            <div style={{
              background: "var(--bg-card-solid, #fff)",
              border: "1px solid var(--border-default, #e7e5e4)",
              borderRadius: "1rem",
              padding: "1.25rem",
            }}>
              <div style={{
                fontWeight: 700,
                marginBottom: "0.75rem",
                color: "var(--text-primary, #1c1917)",
                fontSize: "0.9rem",
              }}>
                Detection Status
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <span style={{
                  fontSize: "0.85rem",
                  color: enabled ? "#22c55e" : "var(--text-muted, #78716c)",
                  fontWeight: 600,
                }}>
                  {enabled ? "🟢 Active" : "⚫ Inactive"}
                </span>
                <button
                  onClick={() => setEnabled(!enabled)}
                  style={{
                    width: "52px",
                    height: "28px",
                    background: enabled
                      ? "linear-gradient(135deg, #00bcd4, #0097a7)"
                      : "var(--ghost-bg, #d1d5db)",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                    boxShadow: enabled ? "0 0 8px rgba(0,188,212,0.3)" : "none",
                  }}
                >
                  <span style={{
                    position: "absolute",
                    top: "3px",
                    left: enabled ? "26px" : "3px",
                    width: "22px",
                    height: "22px",
                    background: "#fff",
                    borderRadius: "50%",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>
            </div>

            {/* Detection radius */}
            <div style={{
              background: "var(--bg-card-solid, #fff)",
              border: "1px solid var(--border-default, #e7e5e4)",
              borderRadius: "1rem",
              padding: "1.25rem",
            }}>
              <div style={{
                fontWeight: 700,
                marginBottom: "0.75rem",
                color: "var(--text-primary, #1c1917)",
                fontSize: "0.9rem",
              }}>
                Detection Radius
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {[1, 5, 10, 25].map((r) => (
                  <label key={r} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary, #57534e)",
                  }}>
                    <input
                      type="radio"
                      name="radius"
                      checked={radius === r}
                      onChange={() => setRadius(r)}
                      style={{ accentColor: "#00bcd4" }}
                    />
                    <span>
                      {r === 1
                        ? "1 mile (hyperlocal)"
                        : r === 5
                          ? "5 miles (nearby)"
                          : r === 10
                            ? "10 miles (town radius)"
                            : "25 miles (county-wide)"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notification prefs */}
            <div style={{
              background: "var(--bg-card-solid, #fff)",
              border: "1px solid var(--border-default, #e7e5e4)",
              borderRadius: "1rem",
              padding: "1.25rem",
            }}>
              <div style={{
                fontWeight: 700,
                marginBottom: "0.75rem",
                color: "var(--text-primary, #1c1917)",
                fontSize: "0.9rem",
              }}>
                Notify Me Via
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { label: "📧 Email", val: notifEmail, set: setNotifEmail },
                  { label: "🔔 Push", val: notifPush, set: setNotifPush },
                  { label: "📱 SMS", val: notifSms, set: setNotifSms },
                ].map(({ label, val, set }) => (
                  <label key={label} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary, #57534e)",
                  }}>
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => set(e.target.checked)}
                      style={{ accentColor: "#00bcd4" }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Data retention */}
            <div style={{
              background: "var(--bg-card-solid, #fff)",
              border: "1px solid var(--border-default, #e7e5e4)",
              borderRadius: "1rem",
              padding: "1.25rem",
            }}>
              <div style={{
                fontWeight: 700,
                marginBottom: "0.5rem",
                color: "var(--text-primary, #1c1917)",
                fontSize: "0.9rem",
              }}>
                Data Retention
              </div>
              <div style={{
                fontSize: "0.78rem",
                color: "var(--text-muted, #78716c)",
                marginBottom: "0.75rem",
              }}>
                Scan results auto-deleted after:
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setRetention(d)}
                    style={{
                      flex: 1,
                      padding: "0.45rem",
                      background: retention === d
                        ? "linear-gradient(135deg, #00bcd4, #0097a7)"
                        : "var(--ghost-bg, #f5f5f4)",
                      color: retention === d ? "#fff" : "var(--text-secondary, #44403c)",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Revoke consent */}
            <div style={{
              background: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: "1rem",
              padding: "1rem 1.25rem",
            }}>
              <div style={{
                fontWeight: 700,
                fontSize: "0.82rem",
                color: "var(--text-primary, #1c1917)",
                marginBottom: "0.35rem",
              }}>
                Revoke Consent
              </div>
              <div style={{
                fontSize: "0.72rem",
                color: "var(--text-muted, #78716c)",
                marginBottom: "0.75rem",
                lineHeight: 1.4,
              }}>
                Disable scanning and delete all scan data. You can re-enable anytime.
              </div>
              <button
                onClick={handleRevokeConsent}
                style={{
                  padding: "0.4rem 0.85rem",
                  background: "rgba(239,68,68,0.08)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "0.5rem",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Revoke & Delete Scan Data
              </button>
            </div>
          </div>

          {/* Main scan area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Scan button */}
            <div style={{
              background: "var(--bg-card-solid, #fff)",
              border: "1px solid var(--border-default, #e7e5e4)",
              borderRadius: "1rem",
              padding: "1.5rem",
              textAlign: "center",
            }}>
              <button
                onClick={runScan}
                disabled={scanning}
                style={{
                  padding: "1rem 3rem",
                  background: scanning
                    ? "var(--ghost-bg, #e7e5e4)"
                    : "linear-gradient(135deg, #00bcd4, #0097a7)",
                  color: scanning ? "var(--text-muted, #78716c)" : "#fff",
                  border: "none",
                  borderRadius: "1rem",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  cursor: scanning ? "not-allowed" : "pointer",
                  boxShadow: scanning ? "none" : "0 4px 16px rgba(0,188,212,0.25)",
                  transition: "all 0.2s ease",
                }}
              >
                {scanning ? "⏳ Scanning..." : "🔍 Scan Public Posts"}
              </button>
              <div style={{
                fontSize: "0.78rem",
                color: "var(--text-muted, #78716c)",
                marginTop: "0.5rem",
              }}>
                Scans public posts within {radius} mile{radius !== 1 ? "s" : ""} of your location
              </div>
            </div>

            {/* Scan progress */}
            {scanning && (
              <div style={{
                background: "rgba(0,188,212,0.04)",
                border: "1px solid rgba(0,188,212,0.15)",
                borderRadius: "1rem",
                padding: "1.25rem",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    border: "3px solid var(--accent, #00bcd4)",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "intentSpin 0.8s linear infinite",
                    flexShrink: 0,
                  }} />
                  <div style={{
                    fontWeight: 700,
                    color: "var(--accent, #00bcd4)",
                  }}>
                    {SCAN_STEPS[Math.min(scanStep, SCAN_STEPS.length - 1)]}
                  </div>
                </div>
                <div style={{
                  height: "6px",
                  background: "var(--ghost-bg, #e0f7fa)",
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #00bcd4, #0097a7)",
                    borderRadius: "9999px",
                    width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%`,
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                  marginTop: "0.75rem",
                }}>
                  {SCAN_STEPS.map((step, i) => (
                    <div key={i} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.78rem",
                      color: i <= scanStep
                        ? "var(--accent, #00bcd4)"
                        : "var(--text-muted, #a8a29e)",
                    }}>
                      <span>{i <= scanStep ? "✓" : "○"}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Match cards */}
            {matches.length > 0 && (
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}>
                  <span style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--text-primary, #1c1917)",
                  }}>
                    🎯 {matches.length} Buyer Matches Found
                  </span>
                  <span style={{
                    padding: "0.1rem 0.4rem",
                    background: "rgba(251,191,36,0.15)",
                    color: "#f59e0b",
                    borderRadius: "9999px",
                    fontSize: "0.58rem",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                  }}>
                    SIMULATED
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      style={{
                        background: "var(--bg-card-solid, #fff)",
                        border: match.confidence >= 85
                          ? "2px solid rgba(0,188,212,0.3)"
                          : "1px solid var(--border-default, #e7e5e4)",
                        borderRadius: "1rem",
                        padding: "1.25rem",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        flexWrap: "wrap",
                      }}>
                        <div>
                          <div style={{
                            fontWeight: 700,
                            color: "var(--text-primary, #1c1917)",
                          }}>
                            {match.buyer}
                          </div>
                          <div style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted, #78716c)",
                            marginTop: "0.15rem",
                          }}>
                            {match.source}
                          </div>
                        </div>
                        <div style={{
                          padding: "0.25rem 0.65rem",
                          background: match.confidence >= 85
                            ? "rgba(0,188,212,0.1)"
                            : "rgba(251,191,36,0.1)",
                          color: match.confidence >= 85
                            ? "var(--accent, #00bcd4)"
                            : "#f59e0b",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}>
                          {match.confidence}% match
                        </div>
                      </div>

                      <div style={{
                        marginTop: "0.75rem",
                        padding: "0.6rem 0.9rem",
                        background: "var(--ghost-bg, #f9f9f8)",
                        borderRadius: "0.6rem",
                        fontSize: "0.82rem",
                        color: "var(--text-secondary, #44403c)",
                        fontStyle: "italic",
                        lineHeight: 1.5,
                      }}>
                        &ldquo;{match.quote}&rdquo;
                      </div>

                      <div style={{
                        marginTop: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}>
                        <div style={{ fontSize: "0.82rem" }}>
                          <span style={{ color: "var(--text-muted, #78716c)" }}>Matched to: </span>
                          <span style={{
                            fontWeight: 700,
                            color: "var(--text-primary, #1c1917)",
                          }}>
                            {match.matchedItem}
                          </span>
                          <span style={{
                            color: "var(--accent, #00bcd4)",
                            fontWeight: 700,
                            marginLeft: "0.5rem",
                          }}>
                            ${match.matchedPrice.toLocaleString()}
                          </span>
                        </div>
                        {!reached.has(match.id) ? (
                          <button
                            onClick={() => reachOut(match.id)}
                            style={{
                              padding: "0.4rem 1rem",
                              background: "linear-gradient(135deg, #00bcd4, #0097a7)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "0.6rem",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0,188,212,0.2)",
                            }}
                          >
                            📤 Reach Out
                          </button>
                        ) : (
                          <div style={{
                            padding: "0.4rem 1rem",
                            background: "rgba(0,188,212,0.08)",
                            color: "var(--accent, #00bcd4)",
                            borderRadius: "0.6rem",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                          }}>
                            ✓ Message Queued
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!scanning && matches.length === 0 && (
              <div style={{
                background: "var(--bg-card-solid, #fff)",
                border: "1px solid var(--border-default, #e7e5e4)",
                borderRadius: "1rem",
                textAlign: "center",
                padding: "3rem",
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📡</div>
                <div style={{
                  fontWeight: 700,
                  color: "var(--text-primary, #1c1917)",
                }}>
                  Ready to scan
                </div>
                <div style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted, #78716c)",
                  marginTop: "0.4rem",
                }}>
                  Press &ldquo;Scan Public Posts&rdquo; to find buyers searching for your items
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes intentSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
