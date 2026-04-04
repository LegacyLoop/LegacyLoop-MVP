/**
 * n8n Webhook Helper
 * Fire-and-forget webhook triggers to n8n automation workflows.
 * Never throws — n8n failures must not affect app operations.
 */

const N8N_URL = process.env.N8N_WEBHOOK_URL;

export function fireN8nWebhook(path: string, data: Record<string, unknown>): void {
  if (!N8N_URL) return;
  fetch(`${N8N_URL}/webhook/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {});
}

/** WF1: New user signup — triggers drip sequence */
export function n8nNewUser(email: string, firstName: string) {
  fireN8nWebhook("new-user", { email, firstName, signupDate: new Date().toISOString() });
}

/** WF11: SMS alert for critical events */
export function n8nSmsAlert(message: string) {
  fireN8nWebhook("sms-alert", { message, timestamp: new Date().toISOString() });
}

/** WF12: New user health check (3-day follow-up) */
export function n8nNewUserCheck(email: string, firstName: string) {
  fireN8nWebhook("new-user-check", { email, firstName, signupDate: new Date().toISOString() });
}

/** WF13: Sale complete — triggers review request */
export function n8nSaleComplete(sellerEmail: string, itemTitle: string, itemId: string, salePrice: number) {
  fireN8nWebhook("sale-complete", { sellerEmail, itemTitle, itemId, salePrice, completedAt: new Date().toISOString() });
}

/** WF15: Payment received — triggers SMS + email alert */
export function n8nPaymentReceived(amount: number, buyerEmail: string, itemTitle: string, type: string) {
  fireN8nWebhook("payment-received", { amount, buyerEmail, itemTitle, type, timestamp: new Date().toISOString() });
}

/** WF18: Auto-responder — routes customer question through AI */
export function n8nAutoRespond(email: string, name: string, question: string) {
  fireN8nWebhook("auto-respond", { email, name, question });
}
