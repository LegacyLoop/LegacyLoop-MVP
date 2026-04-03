import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { createShippingLabel } from "@/lib/adapters/shippo";

export async function POST(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    rateId,
    itemId,
    carrier,
    service,
    weight,
    deliveryMethod,
    estimatedDays,
    fromAddress,
    toAddress,
    rateAmount: clientRateAmount,
  } = body;

  if (!rateId) return Response.json({ error: "Missing rateId" }, { status: 400 });

  // ── Ownership check — only the item owner can create a shipping label ──
  if (itemId) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { userId: true },
    });
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const label = await createShippingLabel(String(rateId));

    // Use the rate amount from the client if provided, otherwise fall back to known mock prices
    const rateAmount = clientRateAmount ? Number(clientRateAmount)
      : rateId === "mock-1" ? 8.95
      : rateId === "mock-2" ? 5.50
      : rateId === "mock-3" ? 12.40
      : rateId === "mock-4" ? 13.20
      : 10.00;

    const initialHistory = [
      { status: "CREATED", timestamp: new Date().toISOString(), location: fromAddress?.city ? `${fromAddress.city}, ${fromAddress.state}` : undefined },
    ];

    // Persist to DB
    const saved = await prisma.shipmentLabel.create({
      data: {
        itemId: itemId || "",
        fromAddressJson: JSON.stringify(fromAddress ?? {}),
        toAddressJson: JSON.stringify(toAddress ?? {}),
        weight: weight ?? 5,
        carrier: carrier ?? label.status?.includes("mock") ? "USPS" : (carrier ?? "Unknown"),
        service: service ?? "Standard",
        rate: rateAmount,
        labelUrl: label.label_url,
        trackingNumber: label.tracking_number,
        trackingUrl: null,
        qrCodeUrl: null,
        status: "CREATED",
        deliveryMethod: deliveryMethod ?? "print",
        estimatedDays: estimatedDays ?? null,
        statusHistory: JSON.stringify(initialHistory),
      },
    });

    // Update item status to SHIPPED
    if (itemId) {
      await prisma.item.update({
        where: { id: itemId },
        data: { status: "SHIPPED" },
      }).catch(() => {});

      // Create event log
      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: "LABEL_CREATED",
          payload: JSON.stringify({
            carrier: carrier ?? "USPS",
            service: service ?? "Standard",
            trackingNumber: label.tracking_number,
            deliveryMethod: deliveryMethod ?? "print",
          }),
        },
      }).catch(() => {});

      // Create notification for seller
      try {
        const item = await prisma.item.findUnique({ where: { id: itemId }, select: { title: true, userId: true } });
        if (item) {
          await prisma.notification.create({
            data: {
              userId: item.userId,
              type: "SHIP_REMINDER",
              title: `Label created for ${item.title || "your item"}`,
              message: `${carrier ?? "USPS"} ${service ?? "Standard"} — tracking: ${label.tracking_number}`,
              link: `/items/${itemId}`,
            },
          });
        }
      } catch { /* non-critical */ }
    }

    return Response.json({
      id: saved.id,
      carrier: saved.carrier,
      service: saved.service,
      trackingNumber: saved.trackingNumber,
      labelUrl: saved.labelUrl,
      rate: saved.rate,
      status: saved.status,
      deliveryMethod: (saved as any).deliveryMethod,
      estimatedDays: (saved as any).estimatedDays,
      statusHistory: (saved as any).statusHistory,
      createdAt: saved.createdAt.toISOString(),
    });
  } catch (e: any) {
    return Response.json({ error: e.message ?? "Label error" }, { status: 500 });
  }
}
