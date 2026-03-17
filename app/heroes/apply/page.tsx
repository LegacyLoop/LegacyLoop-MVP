import type { Metadata } from "next";
import HeroApplyClient from "./HeroApplyClient";

export const metadata: Metadata = {
  title: "Apply for Hero Pricing · LegacyLoop",
  description: "Verify your service for 25% off all LegacyLoop plans.",
};

export default function HeroApplyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <HeroApplyClient />
    </div>
  );
}
