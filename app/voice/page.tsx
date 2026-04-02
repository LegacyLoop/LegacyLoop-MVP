import { authAdapter } from "@/lib/adapters/auth";
import { redirect } from "next/navigation";
import VoiceListeningClient from "./VoiceListeningClient";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata = {
  title: "Buyer Intent Scanner — LegacyLoop",
  description: "AI scans public posts and classifieds to find buyers searching for your items. Fully opt-in, transparent, and revocable.",
};

export default async function BuyerIntentPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Buyer Intent Scanner" }]} />
      <VoiceListeningClient />
    </>
  );
}
