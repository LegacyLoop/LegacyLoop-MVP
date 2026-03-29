"use client";

import { useEffect } from "react";

export default function ArticleViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch("/api/help/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, view: true }),
    }).catch(() => null);
  }, [slug]);

  return null;
}
