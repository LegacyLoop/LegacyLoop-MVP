import { NextRequest, NextResponse } from "next/server";
import { ADDONS } from "@/lib/constants/pricing";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ addonId: string }> }
) {
  const { addonId } = await params;
  const addon = ADDONS.find((a) => a.id === addonId);
  if (!addon) return NextResponse.json({ error: "Add-on not found" }, { status: 404 });
  return NextResponse.json({ addon });
}
