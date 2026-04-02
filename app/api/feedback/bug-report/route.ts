import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || "support@legacy-loop.com";

const SEVERITY_LABELS: Record<string, string> = {
  critical: "CRITICAL",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/**
 * POST /api/feedback/bug-report
 * Accepts bug reports with optional screenshot (base64).
 * Stores in UserEvent, optionally emails admin.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession().catch(() => null);
    const body = await req.json();

    const {
      category,
      description,
      severity = "medium",
      pageUrl,
      screenshot, // base64 data URL (optional)
      userAgent,
      screenSize,
    } = body;

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { error: "Description is required (min 5 characters)" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Truncate screenshot to 2MB max (base64)
    const screenshotTruncated = screenshot && screenshot.length > 2_800_000
      ? null // Too large to store in JSON
      : screenshot || null;

    const reportData = {
      category,
      description: description.trim().slice(0, 2000),
      severity,
      pageUrl: pageUrl || null,
      screenshot: screenshotTruncated,
      userAgent: userAgent?.slice(0, 300) || null,
      screenSize: screenSize || null,
      userId: user?.id || "anonymous",
      userEmail: user?.email || "anonymous",
      timestamp: new Date().toISOString(),
    };

    // Store as UserEvent
    await prisma.userEvent.create({
      data: {
        userId: user?.id || "anonymous",
        eventType: "BUG_REPORT",
        metadata: JSON.stringify({
          ...reportData,
          screenshot: screenshotTruncated ? "[attached]" : null, // Don't duplicate full screenshot in metadata
        }),
      },
    });

    // Store full report with screenshot in EventLog (larger payload)
    await prisma.eventLog.create({
      data: {
        itemId: "BUG_REPORT",
        userId: user?.id || null,
        eventType: "BUG_REPORT",
        payload: JSON.stringify(reportData),
      },
    });

    // Email admin for high/critical severity
    if (severity === "critical" || severity === "high") {
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `[${SEVERITY_LABELS[severity]}] Bug Report: ${category}`,
        html: `<div style="font-family:monospace;padding:16px;background:#111;color:#e2e8f0;border-radius:8px">
          <h2 style="color:#f87171;margin:0 0 12px">Bug Report — ${SEVERITY_LABELS[severity]}</h2>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Page:</strong> ${pageUrl || "N/A"}</p>
          <p><strong>User:</strong> ${user?.email || "anonymous"}</p>
          <p><strong>Description:</strong></p>
          <pre style="white-space:pre-wrap;background:#1a1a2e;padding:12px;border-radius:6px">${description.trim().slice(0, 500)}</pre>
          <p style="font-size:12px;color:#64748b;margin-top:16px">Screen: ${screenSize || "N/A"} | ${screenshotTruncated ? "Screenshot attached in DB" : "No screenshot"}</p>
        </div>`,
      }).catch(() => {});
    }

    console.log(
      `[BUG_REPORT] severity=${severity} category=${category} user=${user?.email || "anon"} page=${pageUrl || "?"}`
    );

    return NextResponse.json({ success: true, id: "submitted" });
  } catch (e) {
    console.error("[BUG_REPORT] Error:", e);
    return NextResponse.json(
      { error: "Failed to submit bug report" },
      { status: 500 }
    );
  }
}
