"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
) {
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isActive || !containerRef.current) return;

    previousFocus.current = document.activeElement;

    const focusableEls = containerRef.current.querySelectorAll(FOCUSABLE);
    const firstEl = focusableEls[0] as HTMLElement | undefined;
    if (firstEl) {
      requestAnimationFrame(() => firstEl.focus());
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (!containerRef.current) return;

      const els = containerRef.current.querySelectorAll(FOCUSABLE);
      const first = els[0] as HTMLElement | undefined;
      const last = els[els.length - 1] as HTMLElement | undefined;
      if (!first || !last) return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus.current && previousFocus.current instanceof HTMLElement) {
        previousFocus.current.focus();
      }
    };
  }, [isActive, containerRef]);
}
