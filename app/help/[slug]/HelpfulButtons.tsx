"use client";

import { useState } from "react";

export default function HelpfulButtons({ slug }: { slug: string }) {
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);

  const handleVote = async (helpful: boolean) => {
    setVoted(helpful ? "yes" : "no");
    try {
      await fetch("/api/help/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, helpful }),
      });
    } catch { /* non-fatal */ }
  };

  return (
    <div style={{
      background: "var(--bg-card, #fff)", border: "1px solid var(--border-default, #e2e8f0)",
      borderRadius: "12px", padding: "1.25rem 1.5rem", marginTop: "1.5rem", textAlign: "center",
    }}>
      {voted ? (
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          {voted === "yes"
            ? "Glad this helped! Thanks for the feedback."
            : "Sorry to hear that. Contact us below for more help."}
        </div>
      ) : (
        <>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
            Was this article helpful?
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
            <button onClick={() => handleVote(true)} style={{
              padding: "0.5rem 1.25rem", fontSize: "0.85rem", cursor: "pointer", minHeight: "44px",
              borderRadius: "8px", border: "1px solid var(--border-default, #e2e8f0)",
              background: "transparent", color: "var(--text-primary, #e2e8f0)", fontWeight: 600,
            }}>
              Yes, it helped
            </button>
            <button onClick={() => handleVote(false)} style={{
              padding: "0.5rem 1.25rem", fontSize: "0.85rem", cursor: "pointer", minHeight: "44px",
              borderRadius: "8px", border: "1px solid var(--border-default, #e2e8f0)",
              background: "transparent", color: "var(--text-primary, #e2e8f0)", fontWeight: 600,
            }}>
              No, I need more help
            </button>
          </div>
        </>
      )}
    </div>
  );
}
