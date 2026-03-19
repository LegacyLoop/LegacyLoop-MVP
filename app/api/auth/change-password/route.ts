import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email/send";
import { emailWrapper, ctaButton, TEXT_PRIMARY, TEXT_SECONDARY } from "@/lib/email/templates";

export async function POST(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { currentPassword, newPassword } = body as {
    currentPassword: string;
    newPassword: string;
  };

  if (!newPassword || newPassword.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return new Response("Unauthorized", { status: 401 });

  const ok = await bcrypt.compare(currentPassword, fullUser.passwordHash);
  if (!ok) {
    return Response.json(
      { error: "Current password is incorrect." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  // Send security notification email (fire-and-forget, never throws)
  const changedAt = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const html = emailWrapper(`
    <h1 style="font-size:22px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 16px;text-align:center">Your password was changed</h1>
    <p style="font-size:15px;color:${TEXT_SECONDARY};line-height:1.7;margin:0 0 8px">
      Your LegacyLoop password was changed on <strong style="color:${TEXT_PRIMARY}">${changedAt}</strong>.
      If this was you, no action is needed.
    </p>
    <p style="font-size:15px;color:${TEXT_SECONDARY};line-height:1.7;margin:0 0 28px">
      If you didn't make this change, contact us immediately.
    </p>
    <div style="text-align:center;margin:0 0 16px">
      ${ctaButton("Contact Support", "mailto:support@legacy-loop.com")}
    </div>
  `);

  sendEmail({
    to: user.email,
    subject: "Your LegacyLoop password was changed",
    html,
  });

  return Response.json({ ok: true });
}
