import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email/send";

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

  const ACCENT = "#00bcd4";
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#161b22;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;border:1px solid rgba(0,188,212,0.15)">
  <tr><td style="padding:32px 32px 16px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08)">
    <div style="display:inline-flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;background:${ACCENT};border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:16px">LL</div>
      <span style="font-size:22px;font-weight:800;color:#f0f6fc;letter-spacing:-0.5px">LegacyLoop</span>
    </div>
  </td></tr>
  <tr><td style="padding:40px 32px">
    <h1 style="font-size:22px;font-weight:700;color:#f0f6fc;margin:0 0 16px;text-align:center">Your password was changed</h1>
    <p style="font-size:15px;color:#8b949e;line-height:1.7;margin:0 0 8px">
      Your LegacyLoop password was changed on <strong style="color:#f0f6fc">${changedAt}</strong>.
      If this was you, no action is needed.
    </p>
    <p style="font-size:15px;color:#8b949e;line-height:1.7;margin:0 0 28px">
      If you didn't make this change, contact us immediately.
    </p>
    <div style="text-align:center;margin:0 0 16px">
      <a href="mailto:support@legacy-loop.com" style="display:inline-block;padding:14px 40px;background:${ACCENT};color:#fff;text-decoration:none;font-weight:700;border-radius:8px;font-size:16px">Contact Support</a>
    </div>
  </td></tr>
  <tr><td style="padding:24px 32px;background:rgba(255,255,255,0.02);text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
    <div style="font-size:12px;color:#484f58;line-height:1.8">
      (512) 758-0518 &middot; support@legacy-loop.com<br>
      LegacyLoop &middot; legacyloopmaine@gmail.com
    </div>
  </td></tr>
</table>
</body>
</html>`;

  sendEmail({
    to: user.email,
    subject: "Your LegacyLoop password was changed",
    html,
  });

  return Response.json({ ok: true });
}
