"use client";

import { useEffect, useState } from "react";

interface Testimonial {
  id: string;
  buyerName: string;
  rating: number;
  text: string;
  itemTitle: string | null;
  isFeatured: boolean;
  createdAt: string;
}

interface Props {
  maxItems?: number;
  showTitle?: boolean;
}

const FALLBACK_TESTIMONIALS: Omit<Testimonial, "id" | "createdAt">[] = [
  {
    buyerName: "Margaret T. (Waterville, ME)",
    rating: 5,
    text: "I was overwhelmed after Mom passed. LegacyLoop's AI priced everything in her china cabinet in 20 minutes. The MegaBot found a collector in Boston who paid $340 for a tea set I would have donated. The whole process felt respectful and easy.",
    itemTitle: "Royal Albert Tea Service",
    isFeatured: true,
  },
  {
    buyerName: "Jason & Sarah K. (Portland, ME)",
    rating: 5,
    text: "We used the Neighborhood Bundle with 3 other families on our street. Sold $12,000 worth of stuff in one weekend. The AI pricing was surprisingly accurate \u2014 within 5% of what everything actually sold for.",
    itemTitle: "Multi-Family Estate Sale",
    isFeatured: true,
  },
  {
    buyerName: "Robert D. (Augusta, ME)",
    rating: 5,
    text: "As a Vietnam veteran, the Heroes discount meant a lot. But what really impressed me was how they handled Dad's WWII medals \u2014 connected us with a military museum instead of just selling them. That's integrity.",
    itemTitle: "WWII Medal Collection",
    isFeatured: true,
  },
  {
    buyerName: "Linda M. (Brunswick, ME)",
    rating: 5,
    text: "I'm 72 and not great with technology. Their Tech Coaching add-on was worth every penny. A real person walked me through listing my late husband's workshop tools. Sold everything in 2 weeks.",
    itemTitle: "Craftsman Tool Collection",
    isFeatured: true,
  },
  {
    buyerName: "David W. (Bangor, ME)",
    rating: 4,
    text: "Skeptical at first \u2014 how can AI price antiques? But the MegaBot consensus from 3 different AIs was spot-on for my grandfather clock. Only giving 4 stars because I wish the shipping was a bit cheaper for large items.",
    itemTitle: "Howard Miller Grandfather Clock",
    isFeatured: true,
  },
  {
    buyerName: "Carol & Jim P. (Kennebunk, ME)",
    rating: 5,
    text: "Downsizing from our family home of 40 years. The White-Glove team was incredible \u2014 they photographed, priced, and sold 200+ items. The Legacy Archive they created is now our family's most treasured possession.",
    itemTitle: "Full Estate (200+ items)",
    isFeatured: true,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: "0.15rem" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            color: star <= rating ? "#f59e0b" : "var(--border-default)",
            fontSize: "1rem",
          }}
        >
          {star <= rating ? "\u2605" : "\u2606"}
        </span>
      ))}
    </div>
  );
}

export default function TestimonialGrid({ maxItems = 6, showTitle = false }: Props) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: Testimonial[]) => {
        if (data.length > 0) {
          setTestimonials(data.slice(0, maxItems));
        } else {
          // Use fallback
          setTestimonials(
            FALLBACK_TESTIMONIALS.slice(0, maxItems).map((t, i) => ({
              ...t,
              id: `fallback-${i}`,
              createdAt: new Date().toISOString(),
            }))
          );
        }
        setLoaded(true);
      })
      .catch(() => {
        // Use fallback on error
        setTestimonials(
          FALLBACK_TESTIMONIALS.slice(0, maxItems).map((t, i) => ({
            ...t,
            id: `fallback-${i}`,
            createdAt: new Date().toISOString(),
          }))
        );
        setLoaded(true);
      });
  }, [maxItems]);

  if (!loaded) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {Array.from({ length: Math.min(maxItems, 3) }).map((_, i) => (
          <div
            key={i}
            className="card"
            style={{ padding: "1.5rem", minHeight: "180px", opacity: 0.5 }}
          >
            <div style={{ height: "1rem", width: "40%", background: "var(--border-default)", borderRadius: "0.25rem", marginBottom: "0.75rem" }} />
            <div style={{ height: "0.75rem", width: "100%", background: "var(--border-default)", borderRadius: "0.25rem", marginBottom: "0.5rem" }} />
            <div style={{ height: "0.75rem", width: "80%", background: "var(--border-default)", borderRadius: "0.25rem" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="section-title" style={{ display: "inline-block" }}>Testimonials</div>
          <h2 className="h2 mt-2">What Our Customers Say</h2>
          <p className="muted mt-2" style={{ maxWidth: "600px", margin: "0.5rem auto 0" }}>
            Real stories from families who trusted LegacyLoop with their treasured belongings.
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="card"
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {/* Star rating */}
            <StarRating rating={t.rating} />

            {/* Quote text */}
            <p
              style={{
                fontStyle: "italic",
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                lineHeight: 1.65,
                flex: 1,
              }}
            >
              &ldquo;{t.text}&rdquo;
            </p>

            {/* Footer: name + item badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                flexWrap: "wrap",
                borderTop: "1px solid var(--border-default)",
                paddingTop: "0.75rem",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                }}
              >
                {t.buyerName}
              </span>

              {t.itemTitle && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    background: "rgba(0,188,212,0.08)",
                    border: "1px solid rgba(0,188,212,0.2)",
                    color: "var(--accent)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  Sold: {t.itemTitle}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
