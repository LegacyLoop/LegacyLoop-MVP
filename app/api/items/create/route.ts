import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { storageAdapter } from "@/lib/adapters/storage";
import { logUserEvent } from "@/lib/data/user-events";

const clampInt = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(n)));

export async function POST(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const formData = await req.formData();

  // Support both single "photo" and multiple "photos[]"
  const photos: File[] = [];
  const singlePhoto = formData.get("photo") as File | null;
  if (singlePhoto && singlePhoto.size > 0) photos.push(singlePhoto);
  const multiPhotos = formData.getAll("photos[]") as File[];
  for (const p of multiPhotos) {
    if (p && p.size > 0) photos.push(p);
  }
  if (photos.length === 0) return new Response("Missing photo", { status: 400 });

  const title = String(formData.get("title") || "").trim() || null;
  const descriptionRaw = String(formData.get("description") || "").trim() || null;
  const condition = String(formData.get("condition") || "").trim() || null;

  // Extra context fields → appended to description for AI analysis
  const ageEstimate = String(formData.get("ageEstimate") || "").trim();
  const functionality = String(formData.get("functionality") || "").trim();
  const packaging = String(formData.get("packaging") || "").trim();
  const numOwners = String(formData.get("numOwners") || "").trim();
  const damageRepairs = String(formData.get("damageRepairs") || "").trim();
  const originalPackaging = String(formData.get("originalPackaging") || "").trim();

  const contextParts: string[] = [];
  if (descriptionRaw) contextParts.push(descriptionRaw);
  if (ageEstimate) contextParts.push(`[Age: ${ageEstimate.replace(/_/g, " ")}]`);
  if (functionality) contextParts.push(`[Functionality: ${functionality.replace(/_/g, " ")}]`);
  if (packaging) contextParts.push(`[Packaging: ${packaging.replace(/_/g, " ")}]`);
  if (numOwners && numOwners !== "Unknown") contextParts.push(`[Owners: ${numOwners}]`);
  if (damageRepairs) contextParts.push(`[Damage/Repairs: ${damageRepairs}]`);
  if (originalPackaging && originalPackaging !== "Not sure") contextParts.push(`[Original Packaging: ${originalPackaging}]`);
  const description = contextParts.length > 0 ? contextParts.join(" | ") : null;

  const purchasePriceRaw = String(formData.get("purchasePrice") || "").trim();
  const purchasePrice = purchasePriceRaw ? Number(purchasePriceRaw) : null;

  const purchaseDateRaw = String(formData.get("purchaseDate") || "").trim();
  const purchaseDate = purchaseDateRaw ? new Date(purchaseDateRaw) : null;

  // NEW: sale method + radius + zip
  const saleMethodRaw = String(formData.get("saleMethod") || "BOTH").toUpperCase();
  const saleMethod =
    saleMethodRaw === "LOCAL_PICKUP" || saleMethodRaw === "ONLINE_SHIPPING" || saleMethodRaw === "BOTH"
      ? saleMethodRaw
      : "BOTH";

  const saleZip = String(formData.get("saleZip") || "").trim() || null;

  const saleRadiusRaw = String(formData.get("saleRadiusMi") || "250").trim();
  const saleRadiusMiNum = saleRadiusRaw ? Number(saleRadiusRaw) : 250;
  const saleRadiusMi = Number.isFinite(saleRadiusMiNum)
    ? clampInt(saleRadiusMiNum, 10, 5000) // ✅ allows 1000+ miles
    : 250;

  let item;
  try {
    item = await prisma.item.create({
      data: {
        userId: user.id,
        status: "DRAFT",
        title,
        description,
        condition,
        purchasePrice,
        purchaseDate,
        saleMethod: saleMethod as any,
        saleZip,
        saleRadiusMi,
        numberOfOwners: numOwners || null,
        approximateAge: ageEstimate || null,
        worksProperly: functionality || null,
        knownDamage: damageRepairs || null,
        hasOriginalPackaging: originalPackaging || null,
      },
    });
  } catch (err: any) {
    console.error("Item create DB error:", err);
    return new Response(`Failed to create item: ${err?.message || "database error"}`, { status: 500 });
  }

  // Fire-and-forget user event
  logUserEvent(user.id, "ITEM_CREATED", { itemId: item.id }).catch(() => null);

  // Save all photos; first is primary
  for (let i = 0; i < photos.length; i++) {
    try {
      const filePath = await storageAdapter.savePhoto(photos[i], item.id);
      await prisma.itemPhoto.create({
        data: { itemId: item.id, filePath, order: i + 1, isPrimary: i === 0 },
      });
    } catch (err: any) {
      console.error(`Photo save error (photo ${i + 1}):`, err);
      // Item was created — return it so the user isn't stuck, they can re-upload photos
      return Response.json({ id: item.id, itemId: item.id, photoError: `Photo ${i + 1} failed to save` });
    }
  }

  return Response.json({ id: item.id, itemId: item.id });
}