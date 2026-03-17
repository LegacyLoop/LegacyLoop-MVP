import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { blurPlatesForItem } from "@/lib/blur-plate";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  try {
    const { blurredCount } = await blurPlatesForItem(itemId);
    return NextResponse.json({ ok: true, blurredCount });
  } catch (e: any) {
    console.error("[blur-plate] Route error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
