import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/bot-mode";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const log = await prisma.eventLog.findFirst({
    where: { itemId, eventType: "STYLEBOT_RESULT" },
    orderBy: { createdAt: "desc" },
  });

  if (!log) {
    return NextResponse.json({ hasResult: false });
  }

  let result = null;
  try { result = log.payload ? JSON.parse(log.payload) : null; } catch { /* ignore */ }

  return NextResponse.json({ hasResult: true, result, createdAt: log.createdAt });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const result = {
    _isDemo: true,
    overallScore: 82,
    presentation: {
      score: 78,
      tips: [
        "Use natural lighting from a window — avoid flash",
        "Place item on a clean, neutral background",
        "Capture from 3-4 angles including any maker marks",
      ],
    },
    listing: {
      score: 85,
      titleSuggestion: "Vintage [Category] — [Era] [Material] [Condition]",
      descriptionTips: [
        "Lead with the most unique feature or selling point",
        "Include exact measurements (L×W×H)",
        "Mention any provenance, markings, or maker stamps",
      ],
    },
    staging: {
      score: 80,
      suggestions: [
        "Group with complementary items for lifestyle context",
        "Include a common object for scale reference",
        "Show the item in use if possible (e.g., cup with saucer)",
      ],
    },
    platforms: [
      { name: "eBay", fit: "Excellent", reason: "Strong collector market" },
      { name: "Facebook Marketplace", fit: "Good", reason: "Local buyer demand" },
      { name: "Etsy", fit: "Good", reason: "Vintage category match" },
    ],
    summary: "Good presentation foundation. Focus on lighting and background improvements for maximum buyer appeal.",
  };

  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "STYLEBOT_RESULT",
      payload: JSON.stringify(result),
    },
  });

  return NextResponse.json({ success: true, result, isDemo: true });
}
