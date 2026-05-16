// app/sylvia/chat/layout.tsx
//
// CMD-SYLVIA-HARDWIRED-CHAT-V1 V20 v2.1 R29 P70 · Wave 14 Slot C · 2026-05-16
//
// Sylvia identity branding wrapper · Server Component default.
// Standalone immersive surface · NO AppNav · NO Footer · zero main app chrome.

import type { Metadata } from "next";
import { authAdapter } from "@/lib/adapters/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sylvia — Legacy-Loop",
  description:
    "Dual-Core AI System · Sylvia is Legacy-Loop's master AI · resale automation + technical partner · built in Maine · connecting generations.",
  icons: {
    icon: "/sylvia-data/branding/sylvia/web-favicon-32.png",
    apple: "/sylvia-data/branding/sylvia/apple-touch-180.png",
  },
};

export default async function SylviaChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth gate before render (custom JWT · BINDING #21 verify-vercel applies post-deploy)
  const session = await authAdapter.getSession();
  if (!session) {
    redirect("/auth/login?from=/sylvia/chat");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0D1117",
        color: "#f1f5f9",
        fontFamily:
          "var(--plusJakarta), 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
