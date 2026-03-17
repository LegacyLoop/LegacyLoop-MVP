export interface AiAnalysis {
  item_name: string;
  category: string;
  brand: string | null;
  model: string | null;
  maker: string | null;
  material: string | null;
  era: string | null;
  style: string | null;
  condition_guess: string;
  condition_score: number; // 1-10 scale
  condition_cosmetic: number; // 1-10 cosmetic grade
  condition_functional: number; // 1-10 functional grade
  condition_details: string; // specific damage/wear observations
  markings: string | null; // labels, stamps, signatures visible
  dimensions_estimate: string | null; // estimated size from context
  completeness: string | null; // "complete set", "partial", "missing parts"
  keywords: string[];
  notes: string;
  confidence: number; // 0..1
  vehicle_year?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_mileage?: string | null;
  vin_visible?: boolean | null;

  // Extended fields (Wave 4A)
  subcategory?: string | null;
  country_of_origin?: string | null;
  visible_issues?: string[];
  positive_notes?: string[];
  restoration_potential?: string | null;

  // Inline pricing estimates
  estimated_value_low?: number | null;
  estimated_value_mid?: number | null;
  estimated_value_high?: number | null;
  pricing_confidence?: number | null; // 0-100
  pricing_rationale?: string | null;
  comparable_description?: string | null;
  value_drivers?: string[];

  // Antique detection
  is_antique?: boolean | null;
  estimated_age_years?: number | null;
  antique_markers?: string[];
  appraisal_recommended?: boolean | null;
  potential_value_if_authenticated?: number | null;

  // Listing suggestions
  recommended_title?: string | null;
  recommended_description?: string | null;
  best_platforms?: string[];

  // Photo quality
  photo_quality_score?: number | null; // 1-10
  photo_improvement_tips?: string[];

  // Verbal summary
  summary?: string | null;

  // Regional pricing intelligence (added for item-specific market data)
  weight_estimate_lbs?: number | null;
  shipping_difficulty?: string | null; // "Easy" | "Moderate" | "Difficult" | "Freight only"
  shipping_notes?: string | null;
  regional_best_city?: string | null;
  regional_best_state?: string | null;
  regional_best_price_low?: number | null;
  regional_best_price_high?: number | null;
  regional_best_why?: string | null;
  regional_local_demand?: string | null; // "Strong" | "Average" | "Weak"
  regional_local_reasoning?: string | null;
  regional_ship_or_local?: string | null;
}

export interface ValuationResult {
  low: number;
  mid: number;
  high: number;
  confidence: number;
  source: string;
  rationale?: string;

  localLow?: number;
  localMid?: number;
  localHigh?: number;
  localConfidence?: number;
  localSource?: string;
  localRationale?: string;

  onlineLow?: number;
  onlineMid?: number;
  onlineHigh?: number;
  onlineConfidence?: number;
  onlineSource?: string;
  onlineRationale?: string;
}
