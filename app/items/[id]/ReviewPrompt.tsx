"use client";

import { useState } from "react";

interface Props {
  itemId: string;
  itemTitle: string;
}

export default function ReviewPrompt({ itemId, itemTitle }: Props) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!text.trim()) {
      setError("Please write a few words about your experience.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: text.trim(), itemId, itemTitle }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit review");
      }

      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="card"
        style={{
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Thank you!</div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Your review will appear after approval. We appreciate your feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.25rem",
        }}
      >
        How was your experience?
      </div>
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "0.82rem",
          marginBottom: "1rem",
        }}
      >
        Share your experience selling &ldquo;{itemTitle}&rdquo; to help other sellers.
      </p>

      {/* Star rating */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          marginBottom: "0.75rem",
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.15rem",
              fontSize: "1.5rem",
              color:
                star <= (hoverRating || rating)
                  ? "#f59e0b"
                  : "var(--border-default)",
              transition: "color 0.15s, transform 0.15s",
              transform:
                star <= (hoverRating || rating) ? "scale(1.1)" : "scale(1)",
            }}
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            {star <= (hoverRating || rating) ? "\u2605" : "\u2606"}
          </button>
        ))}
        <span
          style={{
            marginLeft: "0.5rem",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            alignSelf: "center",
          }}
        >
          {rating}/5
        </span>
      </div>

      {/* Text input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What was your experience like? What would you tell other sellers?"
        rows={3}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "0.75rem",
          border: "1px solid var(--border-default)",
          background: "var(--bg-card-solid, var(--bg-secondary))",
          color: "var(--text-primary)",
          fontSize: "0.88rem",
          resize: "vertical",
          outline: "none",
          fontFamily: "inherit",
        }}
      />

      {error && (
        <p
          style={{
            color: "var(--error-text, #ef4444)",
            fontSize: "0.82rem",
            marginTop: "0.5rem",
          }}
        >
          {error}
        </p>
      )}

      {/* Submit */}
      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary"
          style={{
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}
