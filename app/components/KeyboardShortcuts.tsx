"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function KeyboardShortcuts() {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const meta = isMac ? e.metaKey : e.ctrlKey;

      if (!meta) return;

      // Don't trigger when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      switch (e.key.toLowerCase()) {
        case "k":
          e.preventDefault();
          router.push("/search");
          break;
        case "n":
          e.preventDefault();
          router.push("/items/new");
          break;
        case "/":
          e.preventDefault();
          // Toggle help widget by clicking its button
          const helpBtn = document.querySelector<HTMLButtonElement>(
            '[aria-label="Help"]'
          );
          helpBtn?.click();
          break;
        case "d":
          e.preventDefault();
          router.push("/dashboard");
          break;
      }
    },
    [router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // No UI — this component only adds event listeners
  return null;
}
