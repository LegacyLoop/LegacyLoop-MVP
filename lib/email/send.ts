import { FEATURES } from "@/lib/feature-flags";

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
}

const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "hello@legacy-loop.com";
const DEFAULT_FROM_NAME = process.env.SENDGRID_FROM_NAME || "LegacyLoop";

/**
 * Send an email via SendGrid.
 * - Supports per-email from/fromName overrides
 * - Logs every attempt with structured format
 * - Never throws — email failure should not crash the app
 */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const fromEmail = msg.from || DEFAULT_FROM_EMAIL;
  const fromName = msg.fromName || DEFAULT_FROM_NAME;

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
          from: { email: fromEmail, name: fromName },
          subject: msg.subject,
          content: [{ type: "text/html", value: msg.html }],
        }),
      });

      if (res.ok) {
        console.log(`[EMAIL] to=${msg.to} subject="${msg.subject}" from=${fromEmail} status=sent`);
        return true;
      } else {
        const body = await res.text().catch(() => "");
        console.error(`[EMAIL] to=${msg.to} subject="${msg.subject}" from=${fromEmail} status=failed`);
        console.error(`[EMAIL ERROR] SendGrid ${res.status}: ${body}`);
        return false;
      }
    } else {
      console.log(`[EMAIL NOT SENT — SendGrid not configured] to=${msg.to} subject="${msg.subject}" from=${fromEmail}`);
      return false;
    }
  } catch (err) {
    console.error(`[EMAIL] to=${msg.to} subject="${msg.subject}" from=${fromEmail} status=failed`);
    console.error("[EMAIL ERROR]", err);
    return false;
  }
}

/** Convenience wrapper for trade notification emails */
export async function sendTradeNotification(to: string, subject: string, html: string): Promise<boolean> {
  return sendEmail({ to, subject, html });
}

/** Convenience wrapper for return/refund notification emails */
export async function sendReturnNotification(to: string, subject: string, html: string): Promise<boolean> {
  return sendEmail({ to, subject, html });
}
