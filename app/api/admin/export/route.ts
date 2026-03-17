import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/constants/admin";

/**
 * GET /api/admin/export?type=items|users|events|transactions
 * Returns CSV export of platform data. Admin-only.
 */
export async function GET(req: Request) {
  try {
    const user = await authAdapter.getSession();
    if (!user || !isAdmin(user.email)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "items";

    let csv = "";
    let filename = "";

    switch (type) {
      case "items": {
        const items = await prisma.item.findMany({
          include: { valuation: true, photos: { take: 1 } },
          orderBy: { createdAt: "desc" },
        });
        csv = "id,title,status,category,brand,era,material,maker,conditionGrade,listingPrice,soldPrice,soldAt,createdAt\n";
        for (const i of items) {
          csv += [
            i.id,
            esc(i.title),
            i.status,
            esc(i.category),
            esc(i.brand),
            esc(i.era),
            esc(i.material),
            esc(i.maker),
            esc(i.conditionGrade),
            i.listingPrice ?? "",
            i.soldPrice ?? "",
            i.soldAt?.toISOString() ?? "",
            i.createdAt.toISOString(),
          ].join(",") + "\n";
        }
        filename = "legacyloop-items.csv";
        break;
      }

      case "users": {
        const users = await prisma.user.findMany({
          include: { _count: { select: { items: true } } },
          orderBy: { createdAt: "desc" },
        });
        csv = "id,email,displayName,tier,heroVerified,itemCount,createdAt\n";
        for (const u of users) {
          csv += [
            u.id,
            esc(u.email),
            esc(u.displayName),
            u.tier,
            u.heroVerified,
            u._count.items,
            u.createdAt.toISOString(),
          ].join(",") + "\n";
        }
        filename = "legacyloop-users.csv";
        break;
      }

      case "events": {
        const events = await prisma.eventLog.findMany({
          take: 5000,
          orderBy: { createdAt: "desc" },
          select: { id: true, itemId: true, userId: true, eventType: true, createdAt: true },
        });
        csv = "id,itemId,userId,eventType,createdAt\n";
        for (const e of events) {
          csv += [e.id, e.itemId, e.userId ?? "", e.eventType, e.createdAt.toISOString()].join(",") + "\n";
        }
        filename = "legacyloop-events.csv";
        break;
      }

      case "transactions": {
        const txns = await prisma.transaction.findMany({
          orderBy: { createdAt: "desc" },
        });
        csv = "id,userId,itemId,type,description,amount,commission,netAmount,status,createdAt\n";
        for (const t of txns) {
          csv += [
            t.id,
            t.userId,
            t.itemId ?? "",
            t.type,
            esc(t.description),
            t.amount,
            t.commission,
            t.netAmount,
            t.status,
            t.createdAt.toISOString(),
          ].join(",") + "\n";
        }
        filename = "legacyloop-transactions.csv";
        break;
      }

      default:
        return Response.json({ error: `Unknown export type: ${type}` }, { status: 400 });
    }

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("[admin/export] Failed:", err.message || err);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}

function esc(val: string | null | undefined): string {
  if (!val) return "";
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
