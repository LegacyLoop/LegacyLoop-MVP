import { authAdapter } from "@/lib/adapters/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import BuyerFinderClient from "./BuyerFinderClient";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Buyer Finder · LegacyLoop",
  description: "AI-powered buyer discovery across Facebook, eBay, Craigslist, and Reddit",
};

export default async function BuyersPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Buyer Finder" }]} />
      <BuyerFinderClient />
    </>
  );
}
