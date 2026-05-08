// app/items/[id]/dossier/page.tsx
//
// CMD-NB-SEED-1-ITEM-DASHBOARD-PDF-SCAFFOLD V19 · R22 P1 · 2026-05-07 LATE EOD
//
// NotebookLM Seed 1 · Orphan scaffold route.
// Accessible at /items/<id>/dossier (manual URL only · zero UI links).
// Phase 7 launch adds discoverability via separate cylinder.

import { redirect } from "next/navigation";
import { authAdapter } from "@/lib/adapters/auth";
import { renderDossierStub } from "@/lib/dossier/render-stub";

export const dynamic = "force-dynamic";

export default async function ItemDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await authAdapter.getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const { id: itemId } = await params;
  const dossier = await renderDossierStub(itemId);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        padding: "2rem 1rem",
        maxWidth: "768px",
        margin: "0 auto",
        fontFamily: "var(--font-body)",
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--accent)",
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.02em",
            marginBottom: "0.5rem",
          }}
        >
          Dossier · Coming in Phase 7
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          Item ID:{" "}
          <code style={{ fontFamily: "var(--font-data)" }}>{itemId}</code>
        </p>
      </header>

      <div
        style={{
          backgroundColor: "var(--bg-card-solid)",
          border: "1px solid var(--accent-border)",
          borderRadius: "1rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {dossier.sections.map((section) => (
          <section
            key={section.order}
            style={{
              marginBottom: "1.5rem",
              lineHeight: 1.6,
            }}
          >
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
                fontFamily: "var(--font-heading)",
              }}
            >
              {section.title}
            </h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-body)",
                fontSize: "0.9375rem",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {section.content}
            </pre>
          </section>
        ))}
      </div>

      <footer
        style={{
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          textAlign: "center",
          paddingTop: "1rem",
          borderTop: "1px solid var(--border-default)",
        }}
      >
        Generated:{" "}
        <span style={{ fontFamily: "var(--font-data)" }}>
          {dossier.metadata.generatedAt}
        </span>{" "}
        · Version: {dossier.metadata.version}
      </footer>
    </main>
  );
}
