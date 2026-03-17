import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing · LegacyLoop",
  description: "Digital self-service plans from $0/month or full white-glove estate management in Maine. AI-powered estate sales made simple.",
};

export default function PricingPage() {
  return <PricingClient />;
}
