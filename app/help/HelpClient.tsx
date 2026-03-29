"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { HelpArticle, HelpCategory } from "@/lib/help-articles";
import { searchArticles } from "@/lib/help-articles";
import dynamic from "next/dynamic";

const HelpChatWidget = dynamic(() => import("./HelpChatWidget"), { ssr: false });

interface HelpClientProps {
  categories: HelpCategory[];
  articles: HelpArticle[];
}

const POPULAR_SLUGS = ["first-item-listing", "understanding-ai-pricing", "complete-shipping-guide", "how-megabot-works", "how-analyzebot-works", "signing-up-and-setup"];

export default function HelpClient({ categories, articles }: HelpClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mode, setMode] = useState<"browse" | "faq">("browse");

  const filtered = useMemo(() => {
    const q = search.trim();
    if (q) return searchArticles(q);
    if (activeCategory) return articles.filter(a => a.category === activeCategory);
    return articles;
  }, [articles, search, activeCategory]);

  const popular = useMemo(() => articles.filter(a => POPULAR_SLUGS.includes(a.slug)).slice(0, 4), [articles]);

  const faqItems = useMemo(() => [
    { q: "How do I list my first item?", a: "Go to your Dashboard and click 'Add New Item'. Upload photos, add a description, and click 'Analyze'. Our AI will identify the item, estimate its value, and generate ready-to-post listings." },
    { q: "How much does LegacyLoop cost?", a: "We have 4 plans: Free (3 items), DIY Seller ($10/mo, 25 items), Power Seller ($25/mo, 100 items), and Estate Manager ($75/mo, unlimited). Visit /pricing for full details." },
    { q: "How does AI pricing work?", a: "Our PriceBot scans 42 marketplace platforms including eBay sold listings, Facebook Marketplace, Craigslist, and more to find real comparable sales. It gives you a price range based on actual market data." },
    { q: "Can I sell vehicles on LegacyLoop?", a: "Yes! Upload photos of your vehicle and our CarBot will evaluate it with NHTSA safety data, VIN decoding, and real market comparables from AutoTrader, Cars.com, and eBay Motors." },
    { q: "How do I ship an item?", a: "Go to your item page and scroll to the Shipping section. ShipBot will suggest the right box size, packaging materials, and compare carrier rates. For large items, we offer freight shipping quotes." },
    { q: "What is MegaBot?", a: "MegaBot runs 4 AI engines simultaneously (OpenAI, Claude, Gemini, and Grok) and builds a consensus from all four. It's like getting 4 expert opinions at once." },
    { q: "How do I get the 25% hero discount?", a: "Military, law enforcement, and fire/EMS personnel qualify. Go to /heroes and submit your verification. Once approved, the discount applies to all plans automatically." },
    { q: "How do I cancel my subscription?", a: "Go to Settings > Subscription and click 'Manage Plan'. You can downgrade or cancel anytime. Your items stay safe — you just lose access to premium features." },
    { q: "Is my data safe?", a: "Yes. We use bank-level encryption, secure cookies, and never share your personal information. Photos and data are stored securely and only visible to you and your buyers." },
    { q: "How do I contact support?", a: "Email support@legacy-loop.com, call (207) 555-0127 (Mon-Sat, 8am-8pm EST), or use the contact form below. We typically respond within a few hours." },
  ], []);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div>
      {/* AI Chat Section */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>🤖 Ask Our AI Assistant</div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Get instant answers to any question about LegacyLoop.</div>
        <HelpChatWidget />
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button onClick={() => setMode("browse")} style={{ padding: "0.4rem 1rem", borderRadius: "8px", border: mode === "browse" ? "1px solid var(--accent)" : "1px solid var(--border-default)", background: mode === "browse" ? "rgba(0,188,212,0.08)" : "transparent", color: mode === "browse" ? "var(--accent)" : "var(--text-muted)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", minHeight: "44px" }}>
          Browse Articles
        </button>
        <button onClick={() => setMode("faq")} style={{ padding: "0.4rem 1rem", borderRadius: "8px", border: mode === "faq" ? "1px solid var(--accent)" : "1px solid var(--border-default)", background: mode === "faq" ? "rgba(0,188,212,0.08)" : "transparent", color: mode === "faq" ? "var(--accent)" : "var(--text-muted)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", minHeight: "44px" }}>
          Quick FAQ
        </button>
      </div>

      {mode === "faq" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {faqItems.map((faq, i) => (
            <div key={i} style={{ border: "1px solid var(--border-default, #e2e8f0)", borderRadius: "8px", overflow: "hidden", background: "var(--bg-card, #fff)" }}>
              <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} style={{ width: "100%", padding: "0.75rem 1rem", textAlign: "left", cursor: "pointer", background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "0.88rem", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "48px" }}>
                {faq.q}
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{expandedFaq === i ? "▲" : "▼"}</span>
              </button>
              {expandedFaq === i && (
                <div style={{ padding: "0 1rem 0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Popular Articles */}
          {!search && !activeCategory && popular.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>⭐ Popular Articles</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.5rem" }}>
                {popular.map(a => (
                  <Link key={a.slug} href={`/help/${a.slug}`} style={{ textDecoration: "none" }}>
                    <div style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-default, #e2e8f0)", background: "var(--bg-card, #fff)" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent)" }}>{a.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{a.category}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ marginBottom: "1rem" }}>
            <input type="text" placeholder="Search all articles..." value={search} onChange={e => { setSearch(e.target.value); setActiveCategory(null); }} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border-default)", background: "var(--bg-card, #fff)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", minHeight: "48px" }} />
          </div>

          {/* Category cards */}
          {!search && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem", marginBottom: "1rem" }}>
              {categories.map(cat => {
                const isActive = activeCategory === cat.name;
                return (
                  <button key={cat.name} onClick={() => setActiveCategory(isActive ? null : cat.name)} style={{ padding: "0.75rem", textAlign: "left", cursor: "pointer", borderRadius: "10px", border: isActive ? "1.5px solid var(--accent)" : "1px solid var(--border-default, #e2e8f0)", background: isActive ? "rgba(0,188,212,0.06)" : "var(--bg-card, #fff)" }}>
                    <div style={{ fontSize: "1.2rem", marginBottom: "0.2rem" }}>{cat.icon}</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>{cat.name}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{cat.count} articles</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active filter pill */}
          {activeCategory && (
            <div style={{ marginBottom: "0.75rem" }}>
              <button onClick={() => setActiveCategory(null)} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: "999px", border: "1px solid var(--accent)", background: "rgba(0,188,212,0.06)", color: "var(--accent)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                {activeCategory} × Show all
              </button>
            </div>
          )}

          {/* No results */}
          {filtered.length === 0 && (
            <div style={{ background: "var(--bg-card, #fff)", border: "1px solid var(--border-default, #e2e8f0)", borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>No articles found for &ldquo;{search}&rdquo;.</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Try a different search, or ask our AI assistant above!</div>
            </div>
          )}

          {/* Article list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map(article => (
              <Link key={article.slug} href={`/help/${article.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ padding: "1rem 1.25rem", borderRadius: "10px", border: "1px solid var(--border-default, #e2e8f0)", background: "var(--bg-card, #fff)", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)" }}>{article.title}</div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem", lineHeight: 1.5 }}>{article.summary}</p>
                      <span style={{ display: "inline-block", marginTop: "0.35rem", padding: "0.1rem 0.45rem", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 600, background: "var(--badge-bg, rgba(0,188,212,0.08))", color: "var(--badge-color, #00bcd4)", border: "1px solid var(--badge-border, rgba(0,188,212,0.2))" }}>
                        {article.categoryIcon} {article.category}
                      </span>
                    </div>
                    <div style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>Read →</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
