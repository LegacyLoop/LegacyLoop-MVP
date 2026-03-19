"use client";

import { useState, useRef } from "react";
import Link from "next/link";

/* ── Role options by category ─────────────────────────────────────────────── */

const ROLE_OPTIONS: Record<string, string[]> = {
  MILITARY: [
    "Army Veteran",
    "Navy Veteran",
    "Air Force Veteran",
    "Marine Corps Veteran",
    "Coast Guard Veteran",
    "Active Duty",
    "National Guard/Reserve",
    "Military Spouse",
    "Gold Star Family",
  ],
  LAW_ENFORCEMENT: [
    "Active Police Officer",
    "Retired Law Enforcement",
    "Sheriff/Deputy",
    "State Trooper",
    "Federal Agent",
    "Corrections Officer",
  ],
  FIRE_EMS: [
    "Active Firefighter",
    "Volunteer Firefighter",
    "Retired Firefighter",
    "EMT/Paramedic",
    "Dispatch Personnel",
  ],
};

const PROOF_HINTS: Record<string, string> = {
  MILITARY: "DD-214, VA ID card, or military ID",
  LAW_ENFORCEMENT: "Badge photo + department ID",
  FIRE_EMS: "Department ID or active certification",
};

const CATEGORY_CARDS = [
  { key: "MILITARY", icon: "\uD83C\uDF96\uFE0F", label: "Military" },
  { key: "LAW_ENFORCEMENT", icon: "\uD83D\uDE94", label: "Law Enforcement" },
  { key: "FIRE_EMS", icon: "\uD83D\uDE92", label: "Fire & EMS" },
];

/* ── Component ────────────────────────────────────────────────────────────── */

export default function HeroApplyClient() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [category, setCategory] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Step 1 → 2 validation ── */
  const canContinueStep1 = category && role && fullName.trim() && email.trim();

  /* ── Step 2 → 3 (submit) ── */
  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("fullName", fullName.trim());
      fd.append("email", email.trim());
      fd.append("serviceCategory", category);
      fd.append("serviceDetail", role);
      if (department.trim()) fd.append("department", department.trim());
      if (file) fd.append("proofFile", file);

      const res = await fetch("/api/heroes/apply", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Drag-and-drop helpers ── */
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  /* ── Render ── */
  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ flex: 1 }}>
            <div
              style={{
                height: "4px",
                borderRadius: "2px",
                background: s <= step ? "var(--accent, #00bcd4)" : "var(--border-default)",
                transition: "background 0.3s ease",
              }}
            />
            <div
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                color: s <= step ? "var(--accent, #00bcd4)" : "var(--text-muted)",
                marginTop: "0.35rem",
                textAlign: "center",
              }}
            >
              {s === 1 ? "Eligibility" : s === 2 ? "Upload Proof" : "Confirmation"}
            </div>
          </div>
        ))}
      </div>

      {/* ─── STEP 1: Eligibility ─── */}
      {step === 1 && (
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Apply for Hero Pricing
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Select your service category and role. Verified heroes receive 25% off all plans.
          </p>

          {/* Category cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {CATEGORY_CARDS.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setCategory(c.key);
                  setRole("");
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.25rem 0.75rem",
                  borderRadius: "1rem",
                  border: category === c.key
                    ? "2px solid var(--accent, #00bcd4)"
                    : "1.5px solid var(--border-default)",
                  background: category === c.key
                    ? "rgba(0, 188, 212, 0.06)"
                    : "var(--bg-card-solid, #fff)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  minHeight: "6rem",
                }}
              >
                <span style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>{c.icon}</span>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: category === c.key ? "var(--accent, #00bcd4)" : "var(--text-primary)",
                  }}
                >
                  {c.label}
                </span>
              </button>
            ))}
          </div>

          {/* Role dropdown */}
          {category && (
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                Specific Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1.5px solid var(--border-default, var(--border-default))",
                  background: "var(--bg-card-solid, #fff)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  minHeight: "2.75rem",
                  cursor: "pointer",
                }}
              >
                <option value="">Select your role...</option>
                {(ROLE_OPTIONS[category] || []).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Department / Unit */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
              Department / Unit / Branch (optional)
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Portland Fire Dept, 82nd Airborne..."
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                border: "1.5px solid var(--border-default, var(--border-default))",
                background: "var(--bg-card-solid, #fff)",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                minHeight: "2.75rem",
              }}
            />
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
              Full Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                border: "1.5px solid var(--border-default, var(--border-default))",
                background: "var(--bg-card-solid, #fff)",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                minHeight: "2.75rem",
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
              Email Address <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                border: "1.5px solid var(--border-default, var(--border-default))",
                background: "var(--bg-card-solid, #fff)",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                minHeight: "2.75rem",
              }}
            />
          </div>

          {/* Continue button */}
          <button
            onClick={() => setStep(2)}
            disabled={!canContinueStep1}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "0.85rem 1.5rem",
              fontSize: "1rem",
              borderRadius: "0.75rem",
              minHeight: "2.75rem",
              opacity: canContinueStep1 ? 1 : 0.5,
              cursor: canContinueStep1 ? "pointer" : "not-allowed",
            }}
          >
            Continue
          </button>
        </div>
      )}

      {/* ─── STEP 2: Upload Proof ─── */}
      {step === 2 && (
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Upload Verification
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Upload a document to verify your service. This speeds up the review process.
          </p>

          {/* Drag-and-drop upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              padding: "2.5rem 1.5rem",
              borderRadius: "1rem",
              border: dragOver
                ? "2px dashed var(--accent, #00bcd4)"
                : file
                  ? "2px solid var(--accent, #00bcd4)"
                  : "2px dashed var(--border-default)",
              background: dragOver
                ? "rgba(0, 188, 212, 0.06)"
                : file
                  ? "rgba(0, 188, 212, 0.03)"
                  : "var(--bg-card-solid, #fff)",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginBottom: "1.25rem",
              minHeight: "2.75rem",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.heic,.heif"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {file ? (
              <div>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>&#10003;</div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{file.name}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.35rem 0.85rem",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "#dc2626",
                    background: "transparent",
                    border: "1px solid #dc2626",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    minHeight: "2.75rem",
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem", opacity: 0.4 }}>&#128206;</div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                  Click or drag to upload
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  JPG, PNG, PDF, or HEIC up to 10 MB
                </div>
              </div>
            )}
          </div>

          {/* Category-specific hint */}
          {category && (
            <div
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(251, 191, 36, 0.08)",
                border: "1px solid rgba(251, 191, 36, 0.25)",
                borderRadius: "0.75rem",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                marginBottom: "1rem",
                lineHeight: 1.5,
              }}
            >
              <strong>Accepted documents:</strong> {PROOF_HINTS[category]}
            </div>
          )}

          {/* Privacy note */}
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(0, 188, 212, 0.05)",
              border: "1px solid rgba(0, 188, 212, 0.15)",
              borderRadius: "0.75rem",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginBottom: "1.75rem",
              lineHeight: 1.5,
            }}
          >
            Your documents are encrypted and deleted immediately after verification. We never share your service information.
          </div>

          {error && (
            <div
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(220, 38, 38, 0.08)",
                border: "1px solid rgba(220, 38, 38, 0.25)",
                borderRadius: "0.75rem",
                fontSize: "0.82rem",
                color: "#dc2626",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                padding: "0.85rem 1rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                borderRadius: "0.75rem",
                border: "1.5px solid var(--border-default, var(--border-default))",
                background: "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                minHeight: "2.75rem",
              }}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
              style={{
                flex: 2,
                padding: "0.85rem 1.5rem",
                fontSize: "1rem",
                borderRadius: "0.75rem",
                minHeight: "2.75rem",
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Confirmation ─── */}
      {step === 3 && (
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          {/* Green checkmark animation */}
          <div
            style={{
              width: "5rem",
              height: "5rem",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              animation: "heroCheckPop 0.5s ease-out",
              boxShadow: "0 8px 30px rgba(22, 163, 74, 0.3)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Application Submitted
          </h1>

          {/* Under Review badge */}
          <div style={{ marginBottom: "1.5rem" }}>
            <span
              style={{
                display: "inline-block",
                padding: "0.35rem 1rem",
                background: "#fef9c3",
                color: "#a16207",
                borderRadius: "9999px",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              Under Review
            </span>
          </div>

          {/* Summary */}
          <div
            className="card"
            style={{
              textAlign: "left",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.5rem",
              borderRadius: "1rem",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
              Application Summary
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Name</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{fullName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Email</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Category</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>
                  {CATEGORY_CARDS.find((c) => c.key === category)?.label || category}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Role</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{role}</span>
              </div>
              {department && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Department</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{department}</span>
                </div>
              )}
              {file && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Document</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{file.name}</span>
                </div>
              )}
            </div>
          </div>

          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "2rem", fontSize: "0.92rem" }}>
            We verify within 24 hours and apply your 25% discount immediately.
            You will receive an email at <strong>{email}</strong> once approved.
          </p>

          <Link
            href="/heroes"
            className="btn-primary"
            style={{
              display: "inline-flex",
              padding: "0.85rem 2.5rem",
              fontSize: "1rem",
              borderRadius: "9999px",
              textDecoration: "none",
            }}
          >
            Back to Heroes Program
          </Link>
        </div>
      )}

      {/* Keyframe animation for the checkmark pop */}
      <style>{`
        @keyframes heroCheckPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
