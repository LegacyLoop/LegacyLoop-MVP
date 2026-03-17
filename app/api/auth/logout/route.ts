import { authAdapter } from "@/lib/adapters/auth";

export async function POST() {
  await authAdapter.logout();
  return new Response("OK", { status: 200 });
}