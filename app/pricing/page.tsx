import type { Metadata } from "next";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing · LegacyLoop",
  description: "Digital self-service plans from $0/month or full white-glove estate management in Maine. AI-powered estate sales made simple.",
};

export default function PricingPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Pricing" }]} />
      <PricingClient />
    </>
  );
}
