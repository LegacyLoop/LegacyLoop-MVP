import type { Metadata } from "next";
import QuoteClient from "./QuoteClient";

export const metadata: Metadata = {
  title: "Request a Free Quote - LegacyLoop",
  description:
    "Answer a few quick questions about your estate and get a personalized service recommendation. Free consultation within 24 hours.",
};

export default function QuotePage() {
  return <QuoteClient />;
}
