import { authAdapter } from "@/lib/adapters/auth";
import { redirect } from "next/navigation";
import VoiceListeningClient from "./VoiceListeningClient";

export const metadata = { title: "Voice Buyer Detection — LegacyLoop" };

export default async function VoicePage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  return <VoiceListeningClient />;
}
