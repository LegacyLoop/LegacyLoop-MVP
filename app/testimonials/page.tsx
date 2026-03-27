import type { Metadata } from "next";
import TestimonialGrid from "@/app/components/TestimonialGrid";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Our Customers Say \u00b7 LegacyLoop",
  description:
    "Read real stories from families who trusted LegacyLoop to price, list, and sell their estate items with AI-powered tools.",
};

export default function TestimonialsPage() {
  return (
    <div className="mx-auto max-w-5xl" style={{ padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div className="section-title" style={{ display: "inline-block" }}>
          Testimonials
        </div>
        <h1 className="h2 mt-2">What Our Customers Say</h1>
        <p
          className="muted mt-2"
          style={{ maxWidth: "600px", margin: "0.5rem auto 0" }}
        >
          Real stories from families across Maine who used LegacyLoop to honor
          their loved ones&apos; belongings while getting fair value.
        </p>
      </div>

      {/* Testimonial grid */}
      <TestimonialGrid maxItems={50} />

      {/* CTA card */}
      <div
        className="card"
        style={{
          marginTop: "3rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          Have a story to share?
        </h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            marginBottom: "1.25rem",
            maxWidth: "480px",
            margin: "0 auto 1.25rem",
          }}
        >
          If you&apos;ve sold items through LegacyLoop, we&apos;d love to hear
          about your experience. Reviews appear after a quick approval.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary"
          style={{ display: "inline-block", textDecoration: "none" }}
        >
          Go to Dashboard
        </Link>
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
          textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
          border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
        }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
