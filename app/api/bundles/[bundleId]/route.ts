import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

interface EventLogEntry {
  id: string;
  payload: string | null;
}

function findBundle(logs: EventLogEntry[], bundleId: string): Record<string, unknown> | null {
  for (const l of logs) {
    try {
      const b = JSON.parse(l.payload || "{}");
      if (b.id === bundleId) return { ...b, eventLogId: l.id };
    } catch {
      // skip malformed payload
    }
  }
  return null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ bundleId: string }> }) {
  try {
    const { bundleId } = await params;
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const logs = await prisma.eventLog.findMany({ where: { eventType: "BUNDLE_CREATED" }, orderBy: { createdAt: "desc" }, take: 100 });
    const bundle = findBundle(logs, bundleId);
    if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });

    return NextResponse.json({ bundle });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ bundleId: string }> }) {
  try {
    const { bundleId } = await params;
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));

    const logs = await prisma.eventLog.findMany({ where: { eventType: "BUNDLE_CREATED" }, orderBy: { createdAt: "desc" }, take: 100 });
    const bundle = findBundle(logs, bundleId);
    if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });

    const itemIds = bundle.itemIds as string[] | undefined;

    await prisma.eventLog.create({
      data: { itemId: itemIds?.[0] || "unknown", eventType: "BUNDLE_UPDATED", payload: JSON.stringify({ bundleId, ...body, updatedAt: new Date().toISOString() }) },
    });

    return NextResponse.json({ success: true, bundleId });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ bundleId: string }> }) {
  try {
    const { bundleId } = await params;
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const logs = await prisma.eventLog.findMany({ where: { eventType: "BUNDLE_CREATED" }, orderBy: { createdAt: "desc" }, take: 100 });
    const bundle = findBundle(logs, bundleId);
    if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });

    const itemIds = bundle.itemIds as string[] | undefined;

    await prisma.eventLog.create({
      data: { itemId: itemIds?.[0] || "unknown", eventType: "BUNDLE_EXPIRED", payload: JSON.stringify({ bundleId, expiredAt: new Date().toISOString() }) },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
