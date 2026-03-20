import { authAdapter } from "@/lib/adapters/auth";
import { getShippingRates } from "@/lib/shipping/shippo";

export async function POST(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { fromZip, toZip, weight = 2, length = 12, width = 10, height = 6 } = body;

  if (!fromZip || !toZip) {
    return new Response("Missing fromZip or toZip", { status: 400 });
  }

  try {
    const result = await getShippingRates(
      { zip: String(fromZip) },
      { zip: String(toZip) },
      {
        length: Number(length),
        width: Number(width),
        height: Number(height),
        weight: Number(weight),
      }
    );
    return Response.json({
      rates: result.rates,
      isDemo: result.isDemo,
      isMock: result.isDemo,
      rateSource: result.isDemo ? "demo" : "shippo",
    });
  } catch (e: any) {
    return new Response(e.message ?? "Shipping error", { status: 500 });
  }
}
