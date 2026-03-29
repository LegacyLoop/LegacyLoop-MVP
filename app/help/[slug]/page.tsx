import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug, getArticlesByCategory } from "@/lib/help-articles";
import HelpContact from "../HelpContact";
import HelpfulButtons from "./HelpfulButtons";
import ArticleViewTracker from "./ArticleViewTracker";

type Params = Promise<{ slug: string }>;

function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ol" | "ul" | null = null;

  function flushList() {
    if (listItems.length === 0) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    elements.push(
      <Tag key={`list-${elements.length}`} style={{ paddingLeft: "1.5rem", margin: "0.5rem 0", fontSize: "0.88rem", lineHeight: 1.8, color: "var(--text-secondary)" }}>
        {listItems.map((li, i) => <li key={i} style={{ marginBottom: "0.25rem" }}>{li}</li>)}
      </Tag>
    );
    listItems = [];
    listType = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { flushList(); elements.push(<div key={`br-${i}`} style={{ height: "0.5rem" }} />); continue; }

    // Headings
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(<h2 key={`h-${i}`} style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{trimmed.slice(2)}</h2>);
      continue;
    }

    // Tip callout
    if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <div key={`tip-${i}`} style={{ borderLeft: "3px solid #00bcd4", paddingLeft: "12px", margin: "0.75rem 0", fontSize: "0.85rem", color: "var(--accent, #00bcd4)", background: "rgba(0,188,212,0.06)", padding: "0.5rem 0.75rem 0.5rem 12px", borderRadius: "0 6px 6px 0" }}>
          {trimmed.slice(2)}
        </div>
      );
      continue;
    }

    // Warning callout
    if (trimmed.startsWith("⚠️")) {
      flushList();
      elements.push(
        <div key={`warn-${i}`} style={{ borderLeft: "3px solid #eab308", paddingLeft: "12px", margin: "0.75rem 0", fontSize: "0.85rem", color: "#eab308", background: "rgba(234,179,8,0.06)", padding: "0.5rem 0.75rem 0.5rem 12px", borderRadius: "0 6px 6px 0" }}>
          {trimmed}
        </div>
      );
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (olMatch) {
      if (listType !== "ol") { flushList(); listType = "ol"; }
      listItems.push(olMatch[2]);
      continue;
    }

    // Unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      if (listType !== "ul") { flushList(); listType = "ul"; }
      listItems.push(trimmed.slice(2));
      continue;
    }

    // Regular paragraph with bold support
    flushList();
    const parts = trimmed.split(/\*\*(.+?)\*\*/g);
    elements.push(
      <p key={`p-${i}`} style={{ fontSize: "0.88rem", lineHeight: 1.8, color: "var(--text-secondary)", margin: "0.25rem 0" }}>
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: "var(--text-primary)", fontWeight: 600 }}>{part}</strong> : part)}
      </p>
    );
  }
  flushList();
  return elements;
}

export default async function HelpArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = getArticlesByCategory(article.category).filter(a => a.slug !== slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl">
      <ArticleViewTracker slug={slug} />

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/help" style={{ color: "var(--accent)", textDecoration: "none" }}>Help Center</Link>
        <span>/</span>
        <span>{article.category}</span>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>{article.title}</span>
      </nav>

      {/* Category badge */}
      <div style={{ marginTop: "1rem" }}>
        <span style={{ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600, background: "var(--badge-bg)", color: "var(--badge-color)", border: "1px solid var(--badge-border)" }}>
          {article.categoryIcon} {article.category}
        </span>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.75rem" }}>{article.title}</h1>

      {/* Summary */}
      <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.6 }}>{article.summary}</p>

      {/* Last updated */}
      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Last updated: {article.lastUpdated}</div>

      {/* Content */}
      <div style={{ background: "var(--bg-card, #fff)", border: "1px solid var(--border-default, #e2e8f0)", borderRadius: "12px", padding: "2rem", marginTop: "1.5rem" }}>
        {renderContent(article.content)}
      </div>

      {/* Was this helpful? */}
      <HelpfulButtons slug={slug} />

      {/* Related Articles */}
      {related.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>Related Articles</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {related.map(r => (
              <Link key={r.slug} href={`/help/${r.slug}`} style={{ display: "block", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-default, #e2e8f0)", textDecoration: "none", background: "var(--bg-card, #fff)" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent, #00bcd4)" }}>{r.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{r.summary.slice(0, 100)}...</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <Link href="/help" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>&larr; Back to Help Center</Link>
      </div>

      {/* Contact block */}
      <div style={{ marginTop: "2rem" }}><HelpContact /></div>
    </div>
  );
}
