import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import EditItemForm from "./EditItemForm";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await authAdapter.getSession();
  if (!user) {
    return <div className="card p-8 max-w-xl mx-auto mt-10">Please log in.</div>;
  }

  const item = await prisma.item.findUnique({
    where: { id },
    include: { photos: { orderBy: { order: "asc" } } },
  }).catch((e) => { console.error("[edit-item] item query failed:", e); return null; });

  if (!item || item.userId !== user.id) {
    return <div className="card p-8 max-w-xl mx-auto mt-10">Item not found.</div>;
  }

  // Pass only the fields the client form needs (keeps it simple + stable)
  const initial = {
    id: item.id,
    title: item.title ?? "",
    description: item.description ?? "",
    condition: item.condition ?? "",
    purchasePrice: item.purchasePrice ?? null,
    purchaseDate: item.purchaseDate
      ? new Date(item.purchaseDate).toISOString().slice(0, 10)
      : "",
    saleMethod: (item as any).saleMethod ?? "BOTH",
    saleZip: (item as any).saleZip ?? "",
    saleRadiusMi: (item as any).saleRadiusMi ?? 250,
    shippingWeight: (item as any).shippingWeight ?? null,
    shippingLength: (item as any).shippingLength ?? null,
    shippingWidth: (item as any).shippingWidth ?? null,
    shippingHeight: (item as any).shippingHeight ?? null,
    isFragile: (item as any).isFragile ?? false,
    shippingPreference: (item as any).shippingPreference ?? "BUYER_PAYS",
    category: (item as any).category ?? "",
    brand: (item as any).brand ?? "",
    maker: (item as any).maker ?? "",
    era: (item as any).era ?? "",
    material: (item as any).material ?? "",
    itemStyle: (item as any).itemStyle ?? "",
    countryOfOrigin: (item as any).countryOfOrigin ?? "",
    story: (item as any).story ?? "",
    numberOfOwners: (item as any).numberOfOwners ?? "",
    approximateAge: (item as any).approximateAge ?? "",
    worksProperly: (item as any).worksProperly ?? "",
    knownDamage: (item as any).knownDamage ?? "",
    hasOriginalPackaging: (item as any).hasOriginalPackaging ?? "",
    listingPrice: (item as any).listingPrice ?? null,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="section-title">Item</div>
      <h1 className="h2 mt-2">Edit details</h1>
      <p className="muted mt-2">
        Update anything you know. After saving, use <b>Re-run analysis</b> to refresh AI + pricing.
      </p>

      <div className="mt-8">
        <EditItemForm
          initial={initial}
          initialPhotos={(item!.photos || []).map((p: any) => ({
            id: p.id,
            filePath: p.filePath,
            isPrimary: p.isPrimary,
            order: p.order,
          }))}
        />
      </div>
    </div>
  );
}