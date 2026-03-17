import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

const DEFAULTS = {
  permissionLevel: "monitor",
  defaultTone: "professional",
  autoReplyEnabled: false,
  checkInThreshold: 50,
  weeklyReportEnabled: true,
};

export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Use UserEvent (not EventLog) since settings have no itemId
    const log = await prisma.userEvent.findFirst({
      where: { userId: user.id, eventType: "AGENT_SETTINGS_UPDATED" },
      orderBy: { createdAt: "desc" },
    });
    if (!log?.metadata) return NextResponse.json(DEFAULTS);
    try {
      return NextResponse.json({ ...DEFAULTS, ...JSON.parse(log.metadata) });
    } catch {
      return NextResponse.json(DEFAULTS);
    }
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const settings = { ...DEFAULTS, ...body };

    // Use UserEvent (not EventLog) since settings have no itemId
    await prisma.userEvent.create({
      data: {
        userId: user.id,
        eventType: "AGENT_SETTINGS_UPDATED",
        metadata: JSON.stringify(settings),
      },
    });

    return NextResponse.json({ success: true, ...settings });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
