"use client";

/**
 * CMD-COUNTERS-DASHBOARD V18 · WCS §2 effect #10 1st app-side ratification.
 *
 * Awwwards-canonical count-up: IntersectionObserver fires when the
 * element enters viewport (threshold 0.5) · requestAnimationFrame
 * loop drives a 2200ms ease-out-quart curve from 0 to the target
 * value. Honors `prefers-reduced-motion: reduce` (per WCS §5 +
 * Apple HIG) by rendering the final value immediately and skipping
 * the rAF loop entirely.
 *
 * Null/NaN/negative-safe (clamps to 0). Idempotent — fires once per
 * mount via the `fired` ref, so re-scrolling does not retrigger.
 */

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  duration = 2200,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;

    // Reduced-motion fallback · render final value immediately.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(safeValue);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fired.current) {
          fired.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart
            setDisplay(Math.round(safeValue * eased));
            if (progress < 1) {
              rafRef.current = requestAnimationFrame(tick);
            } else {
              setDisplay(safeValue);
            }
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
