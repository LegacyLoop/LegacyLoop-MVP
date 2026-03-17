import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { token, newPassword } = body;

  if (!token || !newPassword) {
    return new Response("Missing token or password.", { status: 400 });
  }

  if (String(newPassword).length < 8) {
    return new Response("Password must be at least 8 characters.", {
      status: 400,
    });
  }

  const reset = await prisma.passwordReset.findUnique({
    where: { token: String(token) },
  });

  if (!reset || reset.used || reset.expiresAt < new Date()) {
    return new Response(
      "This link has expired. Request a new one.",
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 12);

  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash },
  });

  await prisma.passwordReset.update({
    where: { id: reset.id },
    data: { used: true },
  });

  return Response.json({ ok: true });
}
