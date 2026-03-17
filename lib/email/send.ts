import { FEATURES } from "@/lib/feature-flags";

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email.
 * - If SENDGRID_API_KEY is set, sends via SendGrid API
 * - Otherwise, logs to console (demo mode)
 * - Never throws — email failure should not crash the app
 */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  try {
    if (FEATURES.LIVE_EMAIL && process.env.SENDGRID_API_KEY) {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: msg.to }] }],
          from: { email: "noreply@legacyloop.com", name: "LegacyLoop" },
          subject: msg.subject,
          content: [{ type: "text/html", value: msg.html }],
        }),
      });
      return res.ok;
    } else {
      console.log(`[EMAIL NOT SENT — SendGrid not configured] To: ${msg.to} | Subject: ${msg.subject}`);
      return false;
    }
  } catch (err) {
    console.error("[EMAIL ERROR]", err);
    return false;
  }
}
