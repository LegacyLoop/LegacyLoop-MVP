import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import CarBotClient from "./CarBotClient";

export const metadata = { title: "CarBot — LegacyLoop" };

export default async function CarBotPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const rawItems = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { orderBy: { order: "asc" } },
      aiResult: true,
      valuation: true,
      eventLogs: {
        where: { eventType: "CARBOT_RESULT" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Strict vehicle keywords — word-boundary matched to avoid "car" matching "card"
  const VEHICLE_RX = [
    /\bvehicle\b/i, /\bautomobile\b/i, /\bautomotive\b/i, /\btruck\b/i,
    /\bpickup\b/i, /\bsuv\b/i, /\bsedan\b/i, /\bcoupe\b/i, /\bconvertible\b/i,
    /\bminivan\b/i, /\bmotorcycle\b/i, /\bboat\b/i, /\btractor\b/i,
    /\btrailer\b/i, /\brv\b/i, /\bcamper\b/i, /\batv\b/i, /\bmotorhome\b/i,
  ];
  const isVehicleText = (s: string) => VEHICLE_RX.some((rx) => rx.test(s));

  const serialized = rawItems.map((item) => {
    const ai = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
    return {
      id: item.id,
      title: item.title || `Item #${item.id.slice(0, 6)}`,
      status: item.status,
      photo: item.photos[0]?.filePath ?? null,
      photos: item.photos.map((p) => ({ id: p.id, filePath: p.filePath })),
      hasAnalysis: !!item.aiResult,
      aiResult: item.aiResult?.rawJson ?? null,
      carBotResult: item.eventLogs[0]?.payload ?? null,
      carBotRunAt: item.eventLogs[0]?.createdAt?.toISOString() ?? null,
      category: ai?.category || "general",
      vehicleYear: ai?.vehicle_year || ai?.era || null,
      vehicleMake: ai?.vehicle_make || ai?.brand || null,
      vehicleModel: ai?.vehicle_model || ai?.model || null,
      vehicleMileage: ai?.vehicle_mileage || null,
      vinVisible: ai?.vin_visible || false,
      conditionScore: ai?.condition_score || null,
      valuation: item.valuation ? {
        low: item.valuation.low,
        mid: item.valuation.mid || Math.round((item.valuation.low + item.valuation.high) / 2),
        high: item.valuation.high,
      } : null,
    };
  }).filter((item) =>
    !!item.vehicleYear || !!item.vehicleMake || !!item.carBotResult
    || isVehicleText(item.category) || isVehicleText(item.title)
  );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "CarBot" }]} />
      <Suspense><CarBotClient items={serialized} /></Suspense>
    </div>
  );
}
