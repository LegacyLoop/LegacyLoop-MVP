"use client";

import { useState } from "react";

type Match = {
  id: string;
  buyer: string;
  source: string;
  quote: string;
  confidence: number;
  matchedItem: string;
  matchedPrice: number;
};

const MOCK_MATCHES: Match[] = [
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
  "Scanning nearby social groups...",
  "Analyzing buyer intent signals...",
  "Matching to your inventory...",
  "3 matches found!",
];

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e5e4",
  borderRadius: "1.25rem",
  padding: "1.5rem",
};

export default function VoiceListeningClient() {
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
    setMatches(MOCK_MATCHES);
  }

  function reachOut(matchId: string) {
    setReached((prev) => new Set([...prev, matchId]));
    showToast("✅ Outreach queued — AI message being drafted!");
  }

  // ── Consent gate ──────────────────────────────────────────────────────────
  if (!consentGiven) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...CARD, maxWidth: "520px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎤</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1c1917" }}>Smart Buyer Detection</h1>
          <p style={{ color: "#57534e", marginTop: "0.5rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
            LegacyLoop monitors public social posts and buy/sell boards to find buyers already searching for items like yours — before they find someone else.
          </p>

          <div style={{ marginTop: "1.5rem", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { step: "1", title: "Intent Detection", desc: "AI reads public posts in buy/sell groups, Craigslist wanted ads, and Reddit boards" },
              { step: "2", title: "Smart Match", desc: "Matches buyer language to your inventory using semantic similarity" },
              { step: "3", title: "Instant Alert", desc: "You get notified with a pre-written outreach message ready to send" },
            ].map((s) => (
              <div key={s.step} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ width: "28px", height: "28px", background: "#0f766e", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, flexShrink: 0 }}>{s.step}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{s.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "#78716c", lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f9f9f8", borderRadius: "0.75rem", textAlign: "left" }}>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.5rem" }}>🔒 Privacy Guarantees</div>
            {[
              "Only monitors publicly visible posts — never private messages",
              "No audio recording or ambient capture of any kind",
              "All scan data is deleted after your chosen retention period",
              "You can disable or delete your scan history at any time",
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.78rem", color: "#44403c", marginTop: "0.35rem" }}>
                <span style={{ color: "#0f766e" }}>✓</span>{p}
              </div>
            ))}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "1.25rem", cursor: "pointer", justifyContent: "center", fontSize: "0.85rem", color: "#44403c" }}>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "#0f766e" }}
            />
            I understand this monitors public posts only and agree to the terms
          </label>

          <button
            disabled={!consentChecked}
            onClick={() => setConsentGiven(true)}
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "0.85rem",
              background: consentChecked ? "#0f766e" : "#e7e5e4",
              color: consentChecked ? "#fff" : "#a8a29e",
              border: "none",
              borderRadius: "0.75rem",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: consentChecked ? "pointer" : "not-allowed",
            }}
          >
            🎤 Enable Smart Buyer Detection
          </button>
        </div>
      </div>
    );
  }

  // ── Main interface ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 100,
          background: "#0f766e", color: "#fff", padding: "0.75rem 1.25rem",
          borderRadius: "0.75rem", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          fontSize: "0.9rem",
        }}>
          {toast}
        </div>
      )}

      {/* Beta banner */}
      <div style={{ marginBottom: "1.5rem", padding: "0.65rem 1rem", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "0.75rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span>🧪</span>
        <span style={{ fontSize: "0.82rem", color: "#92400e", fontWeight: 600 }}>
          Beta Feature — Demo Mode · This feature monitors public social posts and classifieds, not ambient audio
        </span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-title">Intelligence</div>
        <h1 className="h1 mt-2">Smart Buyer Detection</h1>
        <p className="muted mt-1">AI scans public posts to find buyers already searching for your items</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Enable toggle */}
          <div style={CARD}>
            <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Detection Status</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: enabled ? "#16a34a" : "#78716c", fontWeight: 600 }}>
                {enabled ? "🟢 Active" : "⚫ Inactive"}
              </span>
              <button
                onClick={() => setEnabled(!enabled)}
                style={{
                  width: "52px", height: "28px",
                  background: enabled ? "#0f766e" : "#d1d5db",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <span style={{
                  position: "absolute",
                  top: "3px",
                  left: enabled ? "26px" : "3px",
                  width: "22px", height: "22px",
                  background: "#fff",
                  borderRadius: "50%",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>
          </div>

          {/* Detection radius */}
          <div style={CARD}>
            <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Detection Radius</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {[1, 5, 10, 25].map((r) => (
                <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem" }}>
                  <input
                    type="radio"
                    name="radius"
                    checked={radius === r}
                    onChange={() => setRadius(r)}
                    style={{ accentColor: "#0f766e" }}
                  />
                  <span>{r === 1 ? "1 mile (hyperlocal)" : r === 5 ? "5 miles (nearby)" : r === 10 ? "10 miles (town radius)" : "25 miles (county-wide)"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notification prefs */}
          <div style={CARD}>
            <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Notify Me Via</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { label: "📧 Email", val: notifEmail, set: setNotifEmail },
                { label: "🔔 Push", val: notifPush, set: setNotifPush },
                { label: "📱 SMS", val: notifSms, set: setNotifSms },
              ].map(({ label, val, set }) => (
                <label key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) => set(e.target.checked)}
                    style={{ accentColor: "#0f766e" }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Data retention */}
          <div style={CARD}>
            <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Data Retention</div>
            <div style={{ fontSize: "0.78rem", color: "#78716c", marginBottom: "0.75rem" }}>Delete scan history after:</div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setRetention(d)}
                  style={{
                    flex: 1,
                    padding: "0.4rem",
                    background: retention === d ? "#0f766e" : "#f5f5f4",
                    color: retention === d ? "#fff" : "#44403c",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main scan area */}
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Scan button */}
          <div style={{ ...CARD, textAlign: "center" }}>
            <button
              onClick={runScan}
              disabled={scanning}
              style={{
                padding: "1rem 3rem",
                background: scanning ? "#e7e5e4" : "linear-gradient(135deg, #0f766e, #0d9488)",
                color: scanning ? "#78716c" : "#fff",
                border: "none",
                borderRadius: "1rem",
                fontWeight: 800,
                fontSize: "1.1rem",
                cursor: scanning ? "not-allowed" : "pointer",
                boxShadow: scanning ? "none" : "0 4px 15px rgba(15,118,110,0.3)",
              }}
            >
              {scanning ? "⏳ Scanning..." : "🔍 Scan Now"}
            </button>
            <div style={{ fontSize: "0.78rem", color: "#78716c", marginTop: "0.5rem" }}>
              Scans within {radius} mile{radius !== 1 ? "s" : ""} of your location
            </div>
          </div>

          {/* Scan progress */}
          {scanning && (
            <div style={{ ...CARD, background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", borderColor: "#86efac" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ width: "36px", height: "36px", border: "3px solid #0f766e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                <div style={{ fontWeight: 700, color: "#15803d" }}>
                  {SCAN_STEPS[Math.min(scanStep, SCAN_STEPS.length - 1)]}
                </div>
              </div>
              <div style={{ height: "6px", background: "#d1fae5", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#0f766e", borderRadius: "9999px", width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%`, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.75rem" }}>
                {SCAN_STEPS.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: i <= scanStep ? "#15803d" : "#a8a29e" }}>
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
              <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.75rem", color: "#1c1917" }}>
                🎯 {matches.length} Buyer Matches Found
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {matches.map((match) => (
                  <div
                    key={match.id}
                    style={{
                      ...CARD,
                      border: match.confidence >= 85 ? "2px solid #86efac" : "1px solid #e7e5e4",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#1c1917" }}>{match.buyer}</div>
                        <div style={{ fontSize: "0.75rem", color: "#78716c", marginTop: "0.15rem" }}>{match.source}</div>
                      </div>
                      <div style={{
                        padding: "0.25rem 0.65rem",
                        background: match.confidence >= 85 ? "#dcfce7" : "#fef3c7",
                        color: match.confidence >= 85 ? "#16a34a" : "#92400e",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}>
                        {match.confidence}% match
                      </div>
                    </div>

                    <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.9rem", background: "#f9f9f8", borderRadius: "0.6rem", fontSize: "0.82rem", color: "#44403c", fontStyle: "italic", lineHeight: 1.5 }}>
                      "{match.quote}"
                    </div>

                    <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ fontSize: "0.82rem" }}>
                        <span style={{ color: "#78716c" }}>Matched to: </span>
                        <span style={{ fontWeight: 700, color: "#1c1917" }}>{match.matchedItem}</span>
                        <span style={{ color: "#0f766e", fontWeight: 700, marginLeft: "0.5rem" }}>${match.matchedPrice.toLocaleString()}</span>
                      </div>
                      {!reached.has(match.id) ? (
                        <button
                          onClick={() => reachOut(match.id)}
                          style={{
                            padding: "0.4rem 1rem",
                            background: "#0f766e",
                            color: "#fff",
                            border: "none",
                            borderRadius: "0.6rem",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          📤 Reach Out
                        </button>
                      ) : (
                        <div style={{ padding: "0.4rem 1rem", background: "#dcfce7", color: "#16a34a", borderRadius: "0.6rem", fontSize: "0.82rem", fontWeight: 700 }}>
                          ✓ Message Queued
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!scanning && matches.length === 0 && (
            <div style={{ ...CARD, textAlign: "center", padding: "3rem", color: "#78716c" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📡</div>
              <div style={{ fontWeight: 700 }}>Ready to scan</div>
              <div style={{ fontSize: "0.82rem", marginTop: "0.4rem" }}>Press "Scan Now" to detect buyers in your area</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
