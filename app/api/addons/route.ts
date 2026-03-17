import { NextResponse } from "next/server";
import { ADDONS } from "@/lib/constants/pricing";

export async function GET() {
  return NextResponse.json({ addons: ADDONS });
}
