"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PROMPTS = [
  "Where did this item come from?",
  "What memories does it hold?",
  "Who owned this before you?",
  "What makes it special or meaningful?",
  "Any family stories attached to it?",
];

interface Props {
  itemId: string;
  initialStory: string | null;
}

export default function StoryCapture({ itemId, initialStory }: Props) {
  const router = useRouter();
  const [story, setStory] = useState(initialStory ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(!!initialStory);
  const [activePrompt, setActivePrompt] = useState<number | null>(null);

  async function saveStory() {
    if (!story.trim()) return;
    setSaving(true);
    await fetch(`/api/items/story/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  function insertPrompt(prompt: string) {
    setActivePrompt(null);
    const prefix = story.trim() ? story.trim() + "\n\n" : "";
    setStory(prefix + prompt + " ");
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          width: "100%",
          padding: "1rem 1.25rem",
          background: "linear-gradient(135deg, #fdf4ff, #f5f3ff)",
          border: "1.5px dashed #c4b5fd",
          borderRadius: "1rem",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "1.5rem" }}>📖</span>
        <div>
          <div style={{ fontWeight: 700, color: "#6d28d9" }}>Add a Story</div>
          <div style={{ fontSize: "0.78rem", color: "#7c3aed", marginTop: "0.1rem" }}>
            Capture the memory behind this item. Stories boost buyer interest and preserve family history.
          </div>
        </div>
        <span style={{ marginLeft: "auto", color: "#c4b5fd", fontSize: "1.25rem" }}>→</span>
      </button>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #fdf4ff, #f5f3ff)",
      border: "1px solid #e9d5ff",
      borderRadius: "1.25rem",
      padding: "1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.25rem" }}>📖</span>
        <div style={{ fontWeight: 700, color: "#6d28d9", fontSize: "1rem" }}>The Story Behind This Item</div>
      </div>

      {/* Prompt chips */}
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.72rem", color: "#7c3aed", fontWeight: 600, marginBottom: "0.4rem" }}>
          Need inspiration? Try a prompt:
        </div>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => insertPrompt(p)}
              style={{
                padding: "0.25rem 0.6rem",
                fontSize: "0.72rem",
                background: activePrompt === i ? "#7c3aed" : "#ede9fe",
                color: activePrompt === i ? "#fff" : "#6d28d9",
                border: "none",
                borderRadius: "9999px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <textarea
        rows={6}
        value={story}
        onChange={(e) => setStory(e.target.value)}
        placeholder="Share the story behind this item. Where did it come from? What memories does it hold? Every story makes the item more meaningful to a buyer..."
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          border: "1px solid #c4b5fd",
          borderRadius: "0.75rem",
          fontSize: "0.88rem",
          lineHeight: 1.6,
          resize: "vertical",
          background: "#fff",
          color: "#1c1917",
          boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
        <button
          onClick={saveStory}
          disabled={saving || !story.trim()}
          style={{
            padding: "0.5rem 1.25rem",
            background: saved ? "#16a34a" : "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: "0.6rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {saving ? "Saving…" : saved ? "✓ Story Saved!" : "Save Story"}
        </button>
        <span style={{ fontSize: "0.72rem", color: "#a8a29e" }}>
          {story.length} chars · appears on your public listing
        </span>
        <button
          onClick={() => setExpanded(false)}
          style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#a8a29e", background: "none", border: "none", cursor: "pointer" }}
        >
          Collapse
        </button>
      </div>
    </div>
  );
}
