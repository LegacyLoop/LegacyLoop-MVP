import { authAdapter } from "@/lib/adapters/auth";
import { redirect } from "next/navigation";

export default async function StorePage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");
  redirect(`/store/${user.id}`);
}
