/**
 * CMD-WEEKLY-REPORT: Premium branded HTML email template.
 * Generates the weekly seller performance report.
 */

interface WeeklyReportEmailData {
  userName: string;
  weekOf: string;
  messagesSent: number;
  agentAssists: number;
  dealsClosed: number;
  scamsBlocked: number;
  itemsNeedingAttention: Array<{ title: string; recommendation: string }>;
  agentRecommendations: string[];
}

export function weeklyReportEmail(data: WeeklyReportEmailData): { subject: string; html: string } {
  const subject = `📊 Your Weekly LegacyLoop Report — Week of ${data.weekOf}`;

  const attentionRows = data.itemsNeedingAttention.length > 0
    ? data.itemsNeedingAttention.map((item) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#cbd5e1;font-size:14px;">${item.title}</td><td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;">${item.recommendation}</td></tr>`
      ).join("")
    : "";

  const recommendations = data.agentRecommendations.map((r) =>
    `<li style="margin-bottom:6px;color:#cbd5e1;font-size:14px;line-height:1.5;">💡 ${r}</li>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#00bcd4;color:#fff;font-weight:800;font-size:18px;padding:10px 20px;border-radius:12px;letter-spacing:0.05em;">LL</div>
      <h1 style="color:#f1f5f9;font-size:24px;font-weight:800;margin:16px 0 4px;">Your Weekly Report</h1>
      <p style="color:#64748b;font-size:14px;margin:0;">Week of ${data.weekOf}</p>
    </div>

    <!-- Greeting -->
    <p style="color:#cbd5e1;font-size:16px;margin-bottom:24px;">Hi ${data.userName} 👋 — here's how your week went:</p>

    <!-- Stats Grid -->
    <div style="margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td width="50%" style="padding:4px;">
            <div style="background:#111827;border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#00bcd4;">${data.dealsClosed}</div>
              <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Items Sold</div>
            </div>
          </td>
          <td width="50%" style="padding:4px;">
            <div style="background:#111827;border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#f1f5f9;">${data.messagesSent}</div>
              <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Messages Sent</div>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding:4px;">
            <div style="background:#111827;border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#a78bfa;">${data.agentAssists}</div>
              <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">AI Assists</div>
            </div>
          </td>
          <td width="50%" style="padding:4px;">
            <div style="background:#111827;border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:${data.scamsBlocked > 0 ? "#ef4444" : "#22c55e"};">${data.scamsBlocked}</div>
              <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Scams Blocked</div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    ${data.itemsNeedingAttention.length > 0 ? `
    <!-- Items Needing Attention -->
    <div style="background:#111827;border:1px solid #374151;border-radius:12px;padding:20px;margin-bottom:28px;">
      <h3 style="color:#fbbf24;font-size:16px;font-weight:700;margin:0 0 12px;">⚠️ Items Needing Attention</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr><th style="text-align:left;padding:8px 12px;border-bottom:2px solid #374151;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Item</th><th style="text-align:left;padding:8px 12px;border-bottom:2px solid #374151;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Recommendation</th></tr>
        ${attentionRows}
      </table>
    </div>` : ""}

    ${recommendations ? `
    <!-- AI Recommendations -->
    <div style="background:rgba(0,188,212,0.06);border:1px solid rgba(0,188,212,0.2);border-radius:12px;padding:20px;margin-bottom:28px;">
      <h3 style="color:#00bcd4;font-size:16px;font-weight:700;margin:0 0 12px;">🤖 AI Insights</h3>
      <ul style="margin:0;padding-left:16px;">${recommendations}</ul>
    </div>` : ""}

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://app.legacy-loop.com/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#00bcd4,#0097a7);color:#fff;font-size:16px;font-weight:700;border-radius:12px;text-decoration:none;">View Dashboard →</a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;border-top:1px solid #1e293b;padding-top:20px;">
      <p style="color:#475569;font-size:12px;margin:0 0 4px;">
        <a href="https://app.legacy-loop.com/settings" style="color:#00bcd4;text-decoration:none;">Manage email preferences</a>
      </p>
      <p style="color:#334155;font-size:11px;margin:0;">LegacyLoop — Connecting Generations</p>
    </div>

  </div>
</body>
</html>`;

  return { subject, html };
}
