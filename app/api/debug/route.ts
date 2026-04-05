import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const tursoUrl = process.env.TURSO_CONNECTION_URL ? "SET" : "NOT SET";
    const tursoToken = process.env.TURSO_AUTH_TOKEN ? "SET" : "NOT SET";
    const dbUrl = process.env.DATABASE_URL ? "SET" : "NOT SET";

    // Try a simple query
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: "ok",
      tursoUrl,
      tursoToken,
      dbUrl,
      userCount,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message,
      tursoUrl: process.env.TURSO_CONNECTION_URL ? "SET" : "NOT SET",
      tursoToken: process.env.TURSO_AUTH_TOKEN ? "SET" : "NOT SET",
      dbUrl: process.env.DATABASE_URL ? "SET" : "NOT SET",
    }, { status: 500 });
  }
}
