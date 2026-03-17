/**
 * User Event Tracking Service
 *
 * Logs user-level behavioral events for analytics and engagement tracking.
 * All functions: fire-and-forget, try/catch, never throw.
 */

import { prisma } from "@/lib/db";

export async function logUserEvent(
  userId: string,
  eventType: string,
  options?: { itemId?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  try {
    await prisma.userEvent.create({
      data: {
        userId,
        eventType,
        itemId: options?.itemId ?? null,
        metadata: options?.metadata ? JSON.stringify(options.metadata) : null,
      },
    });
  } catch (err: any) {
    console.error(`[user-events] logUserEvent failed:`, err.message || err);
  }
}
