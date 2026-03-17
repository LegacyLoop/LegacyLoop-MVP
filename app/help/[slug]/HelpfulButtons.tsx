"use client";

import { useState } from "react";

export default function HelpfulButtons() {
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);

  return (
    <div
      className="card"
      style={{
        padding: "1.25rem 1.5rem",
        marginTop: "1.5rem",
        textAlign: "center",
      }}
    >
      {voted ? (
        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            fontWeight: 500,
          }}
        >
          {voted === "yes"
            ? "Glad this helped! Thanks for the feedback."
            : "Sorry to hear that. Contact us below for more help."}
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "0.75rem",
            }}
          >
            Was this article helpful?
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
            <button
              onClick={() => setVoted("yes")}
              className="btn-ghost"
              style={{
                padding: "0.4rem 1.25rem",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              Yes, it helped
            </button>
            <button
              onClick={() => setVoted("no")}
              className="btn-ghost"
              style={{
                padding: "0.4rem 1.25rem",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              No, I need more help
            </button>
          </div>
        </>
      )}
    </div>
  );
}
