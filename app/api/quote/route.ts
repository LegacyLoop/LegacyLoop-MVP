import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const session = await authAdapter.getSession().catch(() => null);

  const {
    propertyType,
    itemCount,
    categories,
    highValue,
    timeline,
    address,
    city,
    zip,
    contactName,
    contactEmail,
    contactPhone,
    wantAccount,
    submittedAt,
  } = body;

  if (!contactName || !contactEmail) {
    return Response.json(
      { ok: false, error: "Name and email are required" },
      { status: 400 }
    );
  }

  // Map property type to a label
  const propertyTypeMap: Record<string, string> = {
    house_small: "House (1-2 BR)",
    house_medium: "House (3-4 BR)",
    large_estate: "Large Estate (5+ BR)",
    apartment_condo: "Apartment / Condo",
    storage_unit: "Storage Unit",
    other: "Other",
  };

  // Map item count IDs to readable strings
  const itemCountMap: Record<string, string> = {
    under_50: "Under 50",
    "50_100": "50-100",
    "100_300": "100-300",
    "300_500": "300-500",
    "500_plus": "500+",
  };

  // Map property type to a bedrooms estimate
  const bedroomMap: Record<string, number | null> = {
    house_small: 2,
    house_medium: 3,
    large_estate: 5,
    apartment_condo: 2,
    storage_unit: null,
    other: null,
  };

  // Determine recommended tier based on size and item count
  let requestedTier = "ESSENTIALS";
  if (
    itemCount === "500_plus" ||
    itemCount === "300_500" ||
    propertyType === "large_estate"
  ) {
    requestedTier = "PROFESSIONAL";
  } else if (
    itemCount === "100_300" ||
    itemCount === "50_100" ||
    propertyType === "house_medium"
  ) {
    requestedTier = "ESSENTIALS";
  } else {
    requestedTier = "STARTER";
  }

  // Build urgency string
  const urgencyMap: Record<string, string> = {
    asap: "urgent",
    "2_4_weeks": "2-4 weeks",
    "1_2_months": "1-2 months",
    no_rush: "flexible",
  };

  // Generate reference ID
  const referenceId = `QR-${Date.now()}`;

  // Store all quiz data as JSON in additionalNotes
  const quizPayload = JSON.stringify({
    propertyType,
    itemCount,
    categories,
    highValue,
    timeline,
    wantAccount,
    referenceId,
    submittedAt,
  });

  const quote = await prisma.serviceQuote.create({
    data: {
      userId: session?.id ?? null,
      fullName: String(contactName),
      email: String(contactEmail),
      phone: contactPhone ? String(contactPhone) : "",
      address: address ? String(address) : "Not provided",
      city: city ? String(city) : "Not provided",
      state: "ME",
      zip: zip ? String(zip) : "00000",
      propertyType: propertyTypeMap[propertyType as string] ?? "Unknown",
      bedrooms: bedroomMap[propertyType as string] ?? null,
      squareFeet: null,
      estimatedItems: itemCountMap[itemCount as string] ?? "Unknown",
      requestedTier,
      addOnsJson: "[]",
      urgency: urgencyMap[timeline as string] ?? "flexible",
      specialItems: Array.isArray(categories) ? categories.join(", ") : null,
      accessConcerns: highValue ? `High-value items: ${highValue}` : null,
      additionalNotes: `Source: estate intake quiz. Reference: ${referenceId}. Quiz data: ${quizPayload}`,
      status: "NEW",
    },
  });

  return Response.json({
    ok: true,
    success: true,
    quoteId: quote.id,
    referenceId,
  });
}
