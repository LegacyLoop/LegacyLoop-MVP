/**
 * Package Suggestion Engine
 *
 * Uses AI analysis data (category, dimensions_estimate, material) to
 * suggest box size, weight, fragility, and packing notes for an item.
 */

export interface PackageSuggestion {
  boxSize: "tiny" | "small" | "medium" | "large" | "xl" | "oversized" | "furniture" | "freight";
  label: string;
  length: number; // inches
  width: number;
  height: number;
  weightEstimate: number; // lbs
  isFragile: boolean;
  packagingNotes: string[];
}

// ─── Category → package mapping ────────────────────────────────────────────

type PackageTemplate = Omit<PackageSuggestion, "packagingNotes"> & {
  notes: string[];
};

const CATEGORY_MAP: Record<string, PackageTemplate> = {
  book: { boxSize: "small", label: "Book Box", length: 12, width: 9, height: 4, weightEstimate: 3, isFragile: false, notes: ["Wrap in kraft paper", "Fill void with packing paper"] },
  books: { boxSize: "small", label: "Book Box", length: 12, width: 9, height: 4, weightEstimate: 3, isFragile: false, notes: ["Wrap in kraft paper", "Fill void with packing paper"] },
  media: { boxSize: "small", label: "Media Mailer", length: 12, width: 9, height: 4, weightEstimate: 3, isFragile: false, notes: ["Use stiffener cardboard inserts"] },
  electronics: { boxSize: "small", label: "Small Electronics Box", length: 10, width: 8, height: 4, weightEstimate: 3, isFragile: false, notes: ["Use anti-static bubble wrap", "Include padding on all sides"] },
  laptop: { boxSize: "medium", label: "Laptop Box", length: 16, width: 12, height: 4, weightEstimate: 5, isFragile: true, notes: ["Wrap in anti-static bubble wrap", "Minimum 2 inches padding all sides"] },
  phone: { boxSize: "tiny", label: "Small Padded Box", length: 8, width: 6, height: 3, weightEstimate: 1, isFragile: true, notes: ["Wrap in bubble wrap", "Use a rigid box — no poly mailers"] },
  kitchen: { boxSize: "large", label: "Kitchen Box", length: 14, width: 14, height: 12, weightEstimate: 10, isFragile: true, notes: ["Wrap each piece individually", "Layer with crumpled packing paper", "Mark FRAGILE on all sides"] },
  "framed art": { boxSize: "oversized", label: "Art Box", length: 30, width: 24, height: 4, weightEstimate: 8, isFragile: true, notes: ["Corner protectors required", "Face artwork with cardboard", "Do NOT lay flat — ship on edge"] },
  art: { boxSize: "oversized", label: "Art Box", length: 30, width: 24, height: 4, weightEstimate: 8, isFragile: true, notes: ["Corner protectors required", "Face artwork with cardboard"] },
  painting: { boxSize: "oversized", label: "Art Box", length: 30, width: 24, height: 4, weightEstimate: 8, isFragile: true, notes: ["Corner protectors required", "Ship on edge — never flat"] },
  clothing: { boxSize: "medium", label: "Clothing Box", length: 14, width: 12, height: 6, weightEstimate: 3, isFragile: false, notes: ["Fold neatly", "Poly bag inside box for water protection"] },
  shoes: { boxSize: "medium", label: "Shoe Box", length: 14, width: 10, height: 6, weightEstimate: 3, isFragile: false, notes: ["Stuff with paper to keep shape", "Include original box if available"] },
  "small furniture": { boxSize: "xl", label: "Furniture Box", length: 24, width: 20, height: 18, weightEstimate: 25, isFragile: false, notes: ["Disassemble if possible", "Wrap in moving blanket or thick bubble wrap", "Reinforce box corners"] },
  furniture: { boxSize: "furniture", label: "Large Furniture", length: 48, width: 30, height: 30, weightEstimate: 50, isFragile: false, notes: ["Consider freight shipping for large pieces", "Disassemble legs and hardware", "Wrap all surfaces"] },
  collectibles: { boxSize: "small", label: "Collectible Box", length: 10, width: 8, height: 6, weightEstimate: 3, isFragile: true, notes: ["Double-box recommended (box-in-box)", "Minimum 2 inches padding", "Insure for full value"] },
  figurine: { boxSize: "small", label: "Figurine Box", length: 10, width: 8, height: 6, weightEstimate: 2, isFragile: true, notes: ["Double-box required", "Wrap protruding parts individually", "Mark FRAGILE"] },
  jewelry: { boxSize: "tiny", label: "Jewelry Box", length: 8, width: 6, height: 3, weightEstimate: 1, isFragile: false, notes: ["Use a padded jewelry box", "Add insurance for items over $100", "Ship via insured carrier"] },
  watch: { boxSize: "tiny", label: "Watch Box", length: 8, width: 6, height: 4, weightEstimate: 1, isFragile: false, notes: ["Include original box/papers if available", "Insure for full appraised value", "Use signature-required delivery"] },
  camera: { boxSize: "small", label: "Camera Box", length: 10, width: 8, height: 6, weightEstimate: 3, isFragile: true, notes: ["Remove battery before shipping", "Wrap lens separately", "Use foam inserts"] },
  "tea set": { boxSize: "large", label: "China/Porcelain Box", length: 16, width: 16, height: 12, weightEstimate: 8, isFragile: true, notes: ["Wrap EACH piece individually in bubble wrap", "Separate layers with cardboard dividers", "Double-box recommended", "Mark FRAGILE on all sides"] },
  china: { boxSize: "large", label: "China Box", length: 16, width: 16, height: 12, weightEstimate: 8, isFragile: true, notes: ["Wrap each piece individually", "Double-box for valuable sets"] },
  porcelain: { boxSize: "large", label: "Porcelain Box", length: 14, width: 12, height: 10, weightEstimate: 6, isFragile: true, notes: ["Wrap in acid-free tissue then bubble wrap", "Double-box recommended"] },
  vase: { boxSize: "xl", label: "Vase Box", length: 12, width: 12, height: 16, weightEstimate: 6, isFragile: true, notes: ["Fill hollow interior with packing paper", "Wrap in 2+ layers of bubble wrap", "Double-box for antiques"] },
  lamp: { boxSize: "oversized", label: "Lamp Box", length: 16, width: 16, height: 24, weightEstimate: 8, isFragile: true, notes: ["Remove shade and bulb — pack separately", "Wrap base in bubble wrap"] },
  typewriter: { boxSize: "large", label: "Typewriter Box", length: 18, width: 14, height: 10, weightEstimate: 15, isFragile: false, notes: ["Lock carriage if possible", "Wrap in thick bubble wrap", "Double-box recommended for vintage models"] },
  guitar: { boxSize: "furniture", label: "Guitar Case", length: 44, width: 16, height: 6, weightEstimate: 10, isFragile: true, notes: ["Use a hardshell case", "Loosen strings slightly", "Pad headstock and bridge area"] },
  instrument: { boxSize: "oversized", label: "Instrument Box", length: 36, width: 18, height: 12, weightEstimate: 12, isFragile: true, notes: ["Use original case if available", "Add padding inside the case", "Mark FRAGILE and THIS SIDE UP"] },
  tool: { boxSize: "large", label: "Tool Box", length: 16, width: 12, height: 8, weightEstimate: 10, isFragile: false, notes: ["Wrap sharp edges", "Use a sturdy corrugated box"] },
  toy: { boxSize: "medium", label: "Toy Box", length: 12, width: 10, height: 8, weightEstimate: 3, isFragile: false, notes: ["Include batteries separately if applicable", "Protect packaging if collectible"] },
  "trading cards": { boxSize: "tiny", label: "Card Mailer", length: 8, width: 6, height: 2, weightEstimate: 1, isFragile: false, notes: ["Use a rigid top-loader or card saver", "Place in padded mailer or small box", "Do NOT bend — use stiffener"] },
  pokemon: { boxSize: "tiny", label: "Card Mailer", length: 8, width: 6, height: 2, weightEstimate: 1, isFragile: false, notes: ["Use top-loader or card saver", "Ship in a rigid mailer", "Include tracking for valuable cards"] },
  vehicle: { boxSize: "freight", label: "Vehicle (Local Only)", length: 0, width: 0, height: 0, weightEstimate: 3500, isFragile: false, notes: ["Local pickup or professional transport only", "Cannot be shipped via standard carriers"] },
  vehicles: { boxSize: "freight", label: "Vehicle (Local Only)", length: 0, width: 0, height: 0, weightEstimate: 3500, isFragile: false, notes: ["Local pickup or professional transport only", "Cannot be shipped via standard carriers"] },
  boat: { boxSize: "freight", label: "Boat (Local Only)", length: 0, width: 0, height: 0, weightEstimate: 0, isFragile: false, notes: ["Local pickup or professional transport only"] },
  motorcycle: { boxSize: "freight", label: "Motorcycle (Freight)", length: 84, width: 36, height: 48, weightEstimate: 450, isFragile: false, notes: ["Requires freight shipping or local pickup", "Drain fluids before transport", "Secure all loose parts"] },
  // Outdoor / Garden Equipment — NOT vehicles, can be freight shipped
  "riding lawn mower": { boxSize: "freight", label: "Riding Lawn Mower (Freight)", length: 62, width: 42, height: 32, weightEstimate: 400, isFragile: false, notes: ["Drain fuel and oil before shipping", "Disconnect battery", "Secure deck and steering wheel", "Lower mowing deck fully", "Ship on pallet — strap securely"] },
  "lawn mower": { boxSize: "freight", label: "Riding Lawn Mower (Freight)", length: 62, width: 42, height: 32, weightEstimate: 400, isFragile: false, notes: ["Drain fuel and oil before shipping", "Disconnect battery", "Secure deck and steering wheel"] },
  "push mower": { boxSize: "large", label: "Push Mower Box", length: 30, width: 22, height: 20, weightEstimate: 75, isFragile: false, notes: ["Drain fuel completely", "Fold handle down", "Secure blade cover"] },
  "garden tractor": { boxSize: "freight", label: "Garden Tractor (Freight)", length: 72, width: 48, height: 42, weightEstimate: 500, isFragile: false, notes: ["Drain all fluids", "Disconnect battery", "Palletize and strap securely", "Freight carrier required"] },
  "lawn tractor": { boxSize: "freight", label: "Lawn Tractor (Freight)", length: 62, width: 42, height: 32, weightEstimate: 400, isFragile: false, notes: ["Drain fuel and oil", "Disconnect battery", "Ship on pallet"] },
  chainsaw: { boxSize: "medium", label: "Power Tool Box", length: 20, width: 12, height: 10, weightEstimate: 12, isFragile: false, notes: ["Drain fuel completely", "Install bar cover", "Secure chain brake", "Ship with blade guard on"] },
  "leaf blower": { boxSize: "medium", label: "Power Tool Box", length: 20, width: 14, height: 10, weightEstimate: 10, isFragile: false, notes: ["Drain fuel if gas-powered", "Remove battery if cordless"] },
  "pressure washer": { boxSize: "large", label: "Equipment Box", length: 24, width: 20, height: 22, weightEstimate: 45, isFragile: false, notes: ["Drain all water and fuel", "Disconnect hose and wand", "Secure pump"] },
  "snow blower": { boxSize: "freight", label: "Snow Blower (Freight)", length: 36, width: 28, height: 36, weightEstimate: 200, isFragile: false, notes: ["Drain fuel and oil", "Fold handle if possible", "Ship on pallet for heavy models"] },
  "weed trimmer": { boxSize: "medium", label: "Power Tool Box", length: 48, width: 10, height: 8, weightEstimate: 10, isFragile: false, notes: ["Drain fuel if gas-powered", "Remove cutting line guard"] },
  generator: { boxSize: "freight", label: "Generator (Freight)", length: 28, width: 22, height: 24, weightEstimate: 150, isFragile: false, notes: ["Drain ALL fuel — carriers will reject fuel-filled units", "Ship upright", "Secure on pallet"] },
  "outdoor equipment": { boxSize: "freight", label: "Outdoor Equipment (Freight)", length: 48, width: 36, height: 36, weightEstimate: 200, isFragile: false, notes: ["Drain all fluids before shipping", "Palletize and strap securely", "Freight carrier recommended for heavy items"] },
  appliance: { boxSize: "freight", label: "Large Appliance", length: 36, width: 30, height: 36, weightEstimate: 80, isFragile: false, notes: ["Secure doors with tape or straps", "Keep upright — do not lay on side", "Consider freight for heavy units"] },
  piano: { boxSize: "freight", label: "Piano (Freight)", length: 60, width: 30, height: 48, weightEstimate: 500, isFragile: true, notes: ["Requires professional piano movers", "Never lay a piano on its side", "Lock keyboard lid securely"] },
};

// ─── Fragile material detection ────────────────────────────────────────────

const FRAGILE_MATERIALS = [
  "glass", "crystal", "porcelain", "ceramic", "china", "bone china",
  "pottery", "stoneware", "terracotta", "marble", "alabaster",
  "mirror", "opal", "jade",
];

const FRAGILE_CATEGORIES = [
  "kitchen", "china", "porcelain", "vase", "lamp", "figurine",
  "framed art", "painting", "camera", "tea set", "guitar", "instrument",
];

export function isLikelyFragile(category?: string | null, material?: string | null): boolean {
  const cat = (category ?? "").toLowerCase();
  const mat = (material ?? "").toLowerCase();

  if (FRAGILE_CATEGORIES.some((f) => cat.includes(f))) return true;
  if (FRAGILE_MATERIALS.some((f) => mat.includes(f))) return true;

  return false;
}

// ─── Dimension parsing ─────────────────────────────────────────────────────

export function parseDimensions(estimate?: string | null): { length: number; width: number; height: number } | null {
  if (!estimate) return null;

  // Try patterns like "36in wide x 18in deep x 30in tall" or "12 x 8 x 4"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:in|inches|")?\s*(?:wide|w)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:in|inches|")?\s*(?:deep|d)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:in|inches|")?/i,
    /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:in|inches|")\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:in|inches|")\s*[x×]\s*(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = estimate.match(pattern);
    if (match) {
      const dims = [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])].sort((a, b) => b - a);
      return { length: dims[0], width: dims[1], height: dims[2] };
    }
  }

  return null;
}

// ─── Main suggestion function ──────────────────────────────────────────────

export function suggestPackage(
  category?: string | null,
  dimensionsEstimate?: string | null,
  material?: string | null,
  weightLbs?: number | null,
  shippingNotes?: string | null,
): PackageSuggestion {
  const cat = (category ?? "").toLowerCase().trim();

  // Find best matching template — try subcategory-aware matching
  let template: PackageTemplate | null = null;

  // Check for subcategory matches first (more specific)
  // "Musical Instruments > Effects Pedals" → electronics, not instrument
  // "Electronics > ..." → electronics
  if (cat.includes("pedal") || cat.includes("effect")) {
    template = CATEGORY_MAP["electronics"];
  } else if (cat.includes("accessori")) {
    template = CATEGORY_MAP["electronics"];
  }

  // Then try standard category matching
  if (!template) {
    for (const [key, val] of Object.entries(CATEGORY_MAP)) {
      if (cat.includes(key) || key.includes(cat)) {
        template = val;
        break;
      }
    }
  }

  // Default fallback
  if (!template) {
    template = {
      boxSize: "medium",
      label: "Standard Box",
      length: 14,
      width: 12,
      height: 8,
      weightEstimate: 5,
      isFragile: false,
      notes: ["Wrap item in bubble wrap", "Fill empty space with packing paper"],
    };
  }

  // Override with parsed dimensions if available (AI dimensions are item-specific)
  const parsed = parseDimensions(dimensionsEstimate);
  if (parsed) {
    // Add 2 inches to each dimension for padding
    const boxL = Math.ceil(parsed.length + 2);
    const boxW = Math.ceil(parsed.width + 2);
    const boxH = Math.ceil(parsed.height + 2);

    // Pick box size label based on actual dimensions (with 2" padding already added)
    let boxSize: PackageSuggestion["boxSize"] = "medium";
    let label = "Standard Box";
    if (boxL <= 6 && boxW <= 4 && boxH <= 3) { boxSize = "tiny"; label = "Tiny Box"; }
    else if (boxL <= 10 && boxW <= 8 && boxH <= 4) { boxSize = "small"; label = "Small Box"; }
    else if (boxL <= 14 && boxW <= 12 && boxH <= 8) { boxSize = "medium"; label = "Medium Box"; }
    else if (boxL <= 18 && boxW <= 14 && boxH <= 12) { boxSize = "large"; label = "Large Box"; }
    else if (boxL <= 24 && boxW <= 18 && boxH <= 16) { boxSize = "xl"; label = "Extra Large Box"; }
    else if (boxL <= 36 && boxW <= 24 && boxH <= 24) { boxSize = "oversized"; label = "Oversized Box"; }
    else if (boxL <= 48 && boxW <= 30 && boxH <= 30) { boxSize = "furniture"; label = "Furniture Box"; }
    else { boxSize = "freight"; label = "Freight/Custom"; }

    template = {
      ...template,
      length: boxL,
      width: boxW,
      height: boxH,
      boxSize,
      label,
    };
  }

  // Override weight from AI estimate if available
  if (weightLbs != null && weightLbs > 0) {
    template = { ...template, weightEstimate: Math.round(weightLbs * 10) / 10 };
  }

  // Override fragility from material
  const fragile = template.isFragile || isLikelyFragile(cat, material);

  // Build notes — prefer AI-specific notes when available
  const notes: string[] = [];
  if (shippingNotes) {
    notes.push(shippingNotes);
  }
  notes.push(...template.notes);
  if (fragile && !notes.some((n) => n.toLowerCase().includes("fragile"))) {
    notes.push("Mark FRAGILE on all sides");
  }
  if (template.weightEstimate >= 20) {
    notes.push("Use reinforced box rated for " + Math.ceil(template.weightEstimate * 1.5) + "+ lbs");
  }
  // Deduplicate notes
  const uniqueNotes = [...new Set(notes)];

  return {
    boxSize: template.boxSize,
    label: template.label,
    length: template.length,
    width: template.width,
    height: template.height,
    weightEstimate: template.weightEstimate,
    isFragile: fragile,
    packagingNotes: uniqueNotes,
  };
}

// ─── Shipping method suggestion ─────────────────────────────────────────────

export type ShippingMethodSuggestion = "parcel" | "freight" | "local_only" | "local_recommended";

/** Items that MUST be local pickup — too large/heavy/regulated for any carrier */
export const LOCAL_ONLY_CATEGORIES = [
  "vehicle", "vehicles", "car", "truck", "suv", "van",
  "boat", "boats", "watercraft", "jet ski", "kayak", "canoe",
  "motorcycle", "atv", "utv", "dirt bike", "scooter", "go-kart",
  "riding mower", "lawn mower", "mower", "lawn tractor", "zero turn",
  "tractor", "snowmobile", "snowblower",
  "trailer", "rv", "camper",
  "hot tub", "spa", "jacuzzi",
  "pool table", "billiard",
  "piano", "grand piano", "upright piano", "organ",
  "playground", "swing set", "trampoline",
  "shed", "gazebo", "greenhouse",
];

/** Items that need freight/LTL — too big for parcel but shippable */
export const FREIGHT_CATEGORIES = [
  "furniture", "sofa", "couch", "sectional", "armoire", "wardrobe",
  "dresser", "hutch", "china cabinet", "bookcase", "desk",
  "dining table", "table", "bed frame", "mattress",
  "appliance", "refrigerator", "washer", "dryer", "dishwasher",
  "stove", "oven", "range",
  "outdoor equipment", "garden equipment",
  "exercise equipment", "treadmill", "elliptical", "weight bench",
  "safe", "gun safe",
  "statue", "sculpture",
  "large", "oversized", "heavy",
];

/**
 * Suggest the best shipping method based on item category, weight,
 * max dimension, and the seller's chosen sale method.
 */
export function suggestShippingMethod(
  category: string | undefined,
  weight: number | undefined,
  maxDimension: number | undefined,
  saleMethod: string | undefined,
): ShippingMethodSuggestion {
  const cat = (category ?? "").toLowerCase();

  // Check LOCAL_ONLY categories first
  if (LOCAL_ONLY_CATEGORIES.some(term => cat.includes(term))) {
    console.log(`[shipping-method] "${cat}" matches local_only category`);
    return "local_only";
  }

  // Check FREIGHT categories
  if (FREIGHT_CATEGORIES.some(term => cat.includes(term))) {
    console.log(`[shipping-method] "${cat}" matches freight category`);
    return "freight";
  }

  // Seller chose local pickup only
  if (saleMethod === "LOCAL_PICKUP") {
    return "local_only";
  }

  // Over 150 lbs — recommend local (too heavy even for freight in many cases)
  if (weight != null && weight > 150) {
    return "local_recommended";
  }

  // Over 70 lbs or over 48 inches on any side — freight
  if ((weight != null && weight > 70) || (maxDimension != null && maxDimension > 48)) {
    return "freight";
  }

  // Default — standard parcel shipping
  return "parcel";
}
