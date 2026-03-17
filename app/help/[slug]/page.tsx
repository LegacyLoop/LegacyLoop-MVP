import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug } from "@/lib/help-articles";
import HelpContact from "../HelpContact";
import HelpfulButtons from "./HelpfulButtons";

type Params = Promise<{ slug: string }>;

export default async function HelpArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/help"
          style={{ color: "var(--accent)", textDecoration: "none" }}
        >
          Help Center
        </Link>
        <span>/</span>
        <span>{article.category}</span>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>{article.title}</span>
      </nav>

      {/* Category badge */}
      <div style={{ marginTop: "1rem" }}>
        <span
          style={{
            display: "inline-block",
            padding: "0.2rem 0.65rem",
            borderRadius: "999px",
            fontSize: "0.72rem",
            fontWeight: 600,
            background: "var(--badge-bg)",
            color: "var(--badge-color)",
            border: "1px solid var(--badge-border)",
          }}
        >
          {article.categoryIcon} {article.category}
        </span>
      </div>

      {/* Title */}
      <h1
        className="h2"
        style={{ marginTop: "0.75rem" }}
      >
        {article.title}
      </h1>

      {/* Summary */}
      <p
        style={{
          fontSize: "0.92rem",
          color: "var(--text-secondary)",
          marginTop: "0.5rem",
          lineHeight: 1.6,
        }}
      >
        {article.summary}
      </p>

      {/* Last updated */}
      <div
        style={{
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          marginTop: "0.5rem",
        }}
      >
        Last updated: {article.lastUpdated}
      </div>

      {/* Content */}
      <div
        className="card"
        style={{
          padding: "2rem",
          marginTop: "1.5rem",
        }}
      >
        <div
          style={{
            fontSize: "0.88rem",
            lineHeight: 1.8,
            color: "var(--text-secondary)",
            whiteSpace: "pre-line",
          }}
        >
          {article.content}
        </div>
      </div>

      {/* Was this helpful? */}
      <HelpfulButtons />

      {/* Back link */}
      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <Link
          href="/help"
          style={{
            color: "var(--accent)",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          &larr; Back to Help Center
        </Link>
      </div>

      {/* Contact block */}
      <div style={{ marginTop: "2rem" }}>
        <HelpContact />
      </div>
    </div>
  );
}
