import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Items · LegacyLoop", description: "Manage your inventory, track status, and run AI analysis" };

export default function ItemsPage() {
  redirect("/dashboard");
}
