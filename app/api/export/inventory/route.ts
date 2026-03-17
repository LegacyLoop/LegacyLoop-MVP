import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/utils/json";

// GET — CSV export of user's inventory with pricing and antique data
export async function GET() {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    const items = await prisma.item.findMany({
      where: { userId: user.id },
      include: {
        aiResult: { select: { rawJson: true } },
        valuation: {
          select: { low: true, high: true, confidence: true },
        },
        antiqueCheck: {
          select: { isAntique: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const header = [
      "Title",
      "Description",
      "Category",
      "Status",
      "Listing Price",
      "AI Low Estimate",
      "AI High Estimate",
      "Confidence",
      "Is Antique",
      "Created Date",
    ].join(",");

    const rows = items.map((item) => {
      const ai = safeJson(item.aiResult?.rawJson);
      const cols = [
        csvEscape(item.title ?? ""),
        csvEscape(item.description ?? ""),
        csvEscape(ai?.category ?? ""),
        item.status,
        item.listingPrice ?? "",
        item.valuation?.low ?? "",
        item.valuation?.high ?? "",
        item.valuation?.confidence ?? "",
        item.antiqueCheck ? (item.antiqueCheck.isAntique ? "Yes" : "No") : "",
        item.createdAt.toISOString().split("T")[0],
      ];
      return cols.join(",");
    });

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition":
          'attachment; filename="legacyloop-inventory.csv"',
      },
    });
  } catch (err) {
    console.error("Inventory export failed:", err);
    return Response.json(
      { error: "Failed to export inventory" },
      { status: 500 }
    );
  }
}

/** Escape a value for CSV — wrap in quotes if it contains commas, quotes, or newlines */
function csvEscape(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
