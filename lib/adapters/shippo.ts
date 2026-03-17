// Shippo REST API adapter
// Docs: https://goshippo.com/docs/reference
// TODO: Returns flow — add createReturnLabel(originalLabelId) that generates a prepaid return label
// using the Shippo returns API. Should swap from/to addresses and use the cheapest ground rate.

const BASE = "https://api.goshippo.com";

function getToken() {
  const key = process.env.SHIPPO_API_KEY ?? "";
  if (!key || key.includes("PASTE_YOUR") || key.length < 10) return null;
  return key;
}

function headers() {
  const token = getToken();
  if (!token) throw new Error("Missing SHIPPO_API_KEY");
  return {
    Authorization: `ShippoToken ${token}`,
    "Content-Type": "application/json",
  };
}

export type ShippoAddress = {
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country?: string; // defaults to US
};

export type ShippoParcel = {
  length: string; // inches
  width: string;
  height: string;
  distance_unit: "in" | "cm";
  weight: string;   // lbs
  mass_unit: "lb" | "kg";
};

export type ShippoRate = {
  object_id: string;
  provider: string;
  servicelevel_name: string;
  amount: string;
  currency: string;
  estimated_days: number | null;
};

export type ShippoLabel = {
  tracking_number: string;
  label_url: string;
  status: string;
};

// ─── Get shipping rates ────────────────────────────────────────────────────

export async function getShippingRates(
  from: ShippoAddress,
  to: ShippoAddress,
  parcel: ShippoParcel
): Promise<{ rates: ShippoRate[]; isMock: boolean }> {
  if (!getToken()) {
    // Return mock rates when no key is configured
    return {
      isMock: true,
      rates: [
        { object_id: "mock-1", provider: "USPS", servicelevel_name: "Priority Mail", amount: "8.95", currency: "USD", estimated_days: 2 },
        { object_id: "mock-2", provider: "USPS", servicelevel_name: "First Class Package", amount: "5.50", currency: "USD", estimated_days: 4 },
        { object_id: "mock-3", provider: "UPS", servicelevel_name: "UPS Ground", amount: "12.40", currency: "USD", estimated_days: 5 },
        { object_id: "mock-4", provider: "FedEx", servicelevel_name: "FedEx Home Delivery", amount: "13.20", currency: "USD", estimated_days: 3 },
      ],
    };
  }

  const body = {
    address_from: { ...from, country: from.country ?? "US" },
    address_to: { ...to, country: to.country ?? "US" },
    parcels: [parcel],
    async: false,
  };

  const res = await fetch(`${BASE}/shipments/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Shippo shipment error: ${res.status} — ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  const rates: ShippoRate[] = (data.rates ?? []).map((r: any) => ({
    object_id: r.object_id,
    provider: r.provider,
    servicelevel_name: r.servicelevel?.name ?? r.servicelevel_name ?? "Standard",
    amount: r.amount,
    currency: r.currency,
    estimated_days: r.estimated_days ?? null,
  }));

  return { rates, isMock: false };
}

// ─── Create a shipping label ──────────────────────────────────────────────

export async function createShippingLabel(rateId: string): Promise<ShippoLabel> {
  if (!getToken() || rateId.startsWith("mock-")) {
    // Mock label for demo
    return {
      tracking_number: "9400111899223756768185",
      label_url: "https://deliver.goshippo.com/sample_label.pdf",
      status: "SUCCESS (mock)",
    };
  }

  const res = await fetch(`${BASE}/transactions/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ rate: rateId, label_file_type: "PDF", async: false }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Shippo label error: ${res.status} — ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    tracking_number: data.tracking_number ?? "",
    label_url: data.label_url ?? "",
    status: data.status ?? "UNKNOWN",
  };
}

export function isShippoConfigured() {
  return !!getToken();
}
