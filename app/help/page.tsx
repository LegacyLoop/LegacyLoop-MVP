import { helpArticles, helpCategories } from "@/lib/help-articles";
import HelpClient from "./HelpClient";
import HelpContact from "./HelpContact";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Help Center · LegacyLoop", description: "Get answers from our AI assistant or browse 50+ help articles" };

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="section-title">Support</div>
      <h1 className="h2 mt-2">Help Center</h1>
      <p className="muted mt-3">Find answers, guides, and support for LegacyLoop.</p>
      <div className="mt-8">
        <HelpClient categories={helpCategories} articles={helpArticles} />
      </div>
      <div className="mt-10">
        <HelpContact />
      </div>
    </div>
  );
}
