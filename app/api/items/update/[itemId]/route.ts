import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { SaleMethod } from "@prisma/client";

function asNullableString(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function asNullableNumber(v: unknown) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function asNullableDate(v: unknown) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function asSaleMethod(v: unknown, fallback: SaleMethod) {
  const s = String(v ?? "").trim();
  const allowed = Object.values(SaleMethod) as string[];
  if (allowed.includes(s)) return s as SaleMethod;
  return fallback;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;

  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  const title = asNullableString(body.title);
  const description = asNullableString(body.description);
  const condition = asNullableString(body.condition);
  const purchasePrice = asNullableNumber(body.purchasePrice);
  const purchaseDate = asNullableDate(body.purchaseDate);

  const saleZip = asNullableString(body.saleZip);
  const saleMethod = asSaleMethod(body.saleMethod, item.saleMethod);

  const radiusRaw = asNullableNumber(body.saleRadiusMi);
  const saleRadiusMi = clampInt(
    radiusRaw ?? item.saleRadiusMi ?? 250,
    1,
    5000
  );

  // New detail fields
  const category = asNullableString(body.category);
  const brand = asNullableString(body.brand);
  const maker = asNullableString(body.maker);
  const era = asNullableString(body.era);
  const material = asNullableString(body.material);
  const itemStyle = asNullableString(body.itemStyle);
  const countryOfOrigin = asNullableString(body.countryOfOrigin);
  const story = asNullableString(body.story);
  const numberOfOwners = asNullableString(body.numberOfOwners);
  const approximateAge = asNullableString(body.approximateAge);
  const worksProperly = asNullableString(body.worksProperly);
  const knownDamage = asNullableString(body.knownDamage);
  const hasOriginalPackaging = asNullableString(body.hasOriginalPackaging);
  const listingPriceVal = asNullableNumber(body.listingPrice);

  // Shipping fields (optional)
  const shippingWeight = asNullableNumber(body.shippingWeight);
  const shippingLength = asNullableNumber(body.shippingLength);
  const shippingWidth = asNullableNumber(body.shippingWidth);
  const shippingHeight = asNullableNumber(body.shippingHeight);
  const isFragile = body.isFragile === true ? true : body.isFragile === false ? false : undefined;
  const shippingPreference = (["BUYER_PAYS", "FREE_SHIPPING", "LOCAL_ONLY"].includes(body.shippingPreference))
    ? body.shippingPreference as string
    : undefined;

  await prisma.item.update({
    where: { id: itemId },
    data: {
      title,
      description,
      condition,
      purchasePrice,
      purchaseDate,
      saleZip,
      saleMethod,
      saleRadiusMi,
      ...(shippingWeight !== undefined && { shippingWeight }),
      ...(shippingLength !== undefined && { shippingLength }),
      ...(shippingWidth !== undefined && { shippingWidth }),
      ...(shippingHeight !== undefined && { shippingHeight }),
      ...(isFragile !== undefined && { isFragile }),
      ...(shippingPreference !== undefined && { shippingPreference }),
      ...(category !== undefined && { category }),
      ...(brand !== undefined && { brand }),
      ...(maker !== undefined && { maker }),
      ...(era !== undefined && { era }),
      ...(material !== undefined && { material }),
      ...(itemStyle !== undefined && { itemStyle }),
      ...(countryOfOrigin !== undefined && { countryOfOrigin }),
      ...(story !== undefined && { story }),
      ...(numberOfOwners !== undefined && { numberOfOwners }),
      ...(approximateAge !== undefined && { approximateAge }),
      ...(worksProperly !== undefined && { worksProperly }),
      ...(knownDamage !== undefined && { knownDamage }),
      ...(hasOriginalPackaging !== undefined && { hasOriginalPackaging }),
      ...(listingPriceVal !== undefined && { listingPrice: listingPriceVal }),
    },
  });

  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "ITEM_UPDATED",
      payload: JSON.stringify({
        saleMethod, saleZip, saleRadiusMi,
        fieldsUpdated: Object.keys(body).filter(k => body[k] != null && body[k] !== ""),
      }),
    },
  });

  return Response.json({ ok: true });
}
