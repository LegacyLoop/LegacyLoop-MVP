"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnalyzeButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async (force = false) => {
    setBusy(true);
    setMsg("");
    const url = force ? `/api/analyze/${itemId}?force=1` : `/api/analyze/${itemId}`;
    const res = await fetch(url, { method: "POST" });
    const text = await res.text();
    if (!res.ok) setMsg(text || "Analyze failed");
    else if (text.includes("SKIPPED")) setMsg("Already analyzed (saved). Click Re-run to refresh.");
    const scrollY = window.scrollY;
    router.refresh();
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <button onClick={() => run(false)} disabled={busy} className="btn-primary w-full py-4">
        {busy ? "Analyzing..." : "Analyze with AI"}
      </button>

      <button onClick={() => run(true)} disabled={busy} className="btn-ghost w-full justify-center">
        Re-run analysis
      </button>

      {msg && <div className="muted text-sm">{msg}</div>}
    </div>
  );
}