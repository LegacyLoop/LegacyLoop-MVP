// lib/sylvia/swarm-activate/consumer-hooks.ts
//
// CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20 v2.1 R29 P-WAVE-20-PHASE-7 · 2026-05-18
// ★ FOUNDATION-UP DOCTRINE · #45 LAW-emerging 1/5 → 2/5 ratchet ★
//
// Phase D CCL + Phase D MPMA + Phase E Inbound API consumer hooks pre-positioned.
// Combined with Phase 6 graphify 4 hooks = 7 total Phase C/D/E hooks pre-positioned.
// v1 stubs return config + roster + namespace · full impls land in consumer cyls.

import { getCanonicalRoster } from "../swarm";
import type { SwarmAgentSpec } from "../swarm";
import type {
  PerCustomerActivationConfig,
  PerPlatformActivationConfig,
  PerConsumerActivationConfig,
} from "./types";

const DEFAULT_CUSTOMER_AGENTS = 5;  // Queen + 4 specialists per customer
const DEFAULT_RATE_LIMIT = 100;     // swarm tasks/hr per Phase E consumer

/**
 * Phase D CCL · multi-customer parallel activation.
 * v1 stub: returns config + namespace + sliced roster.
 * Full impl Phase D Cyl A wires per-customer state isolation + parallel dispatch.
 */
export async function activatePerCustomerAgents(
  config: PerCustomerActivationConfig,
): Promise<{
  swarmId: string;
  roster: SwarmAgentSpec[];
  namespace: string;
}> {
  const namespace = `customer:${config.customerId}`;
  const maxAgents = config.maxAgents ?? DEFAULT_CUSTOMER_AGENTS;
  const canonical = getCanonicalRoster();
  // Pick Queen + first N specialists for per-customer swarm
  const roster = canonical.slice(0, maxAgents);
  return {
    swarmId: `customer-swarm-${config.customerId}-${config.scope}`,
    roster,
    namespace,
  };
}

/**
 * Phase D MPMA · per-platform agent specialization.
 * v1 stub: returns config + namespace + canonical roster filtered by MPMA roles.
 * Full impl Phase D Cyl B (eBay first) wires platform-specific listing optimization.
 */
export async function activatePerPlatformAgents(
  config: PerPlatformActivationConfig,
): Promise<{
  swarmId: string;
  roster: SwarmAgentSpec[];
  namespace: string;
}> {
  const namespace = `platform:${config.platformName}`;
  const canonical = getCanonicalRoster();
  // Filter to marketplace-domain roles · optionally include MPMA-reserved
  const roster: SwarmAgentSpec[] = canonical.filter(
    (s) => s.domain === "marketplace" || s.role === "queen",
  );
  // MPMA reserved roles activation hint (Phase D Cyl B wires from MPMA_RESERVED_ROSTER)
  if (config.pricingAnalyst) {
    roster.push({
      role: "pricing-analyst",
      domain: "marketplace",
      preferredTier: "T2",
    });
  }
  if (config.listingOptimizer) {
    roster.push({
      role: "listing-optimizer",
      domain: "marketplace",
      preferredTier: "T2",
    });
  }
  return {
    swarmId: `platform-swarm-${config.platformName}-${config.scope}`,
    roster,
    namespace,
  };
}

/**
 * Phase E Inbound API · per-consumer isolated swarm.
 * v1 stub: auth-token sanity check + rate-limit echo + canonical roster slice.
 * Full impl Phase E Cyl A (M30 moat) wires Bearer-token verify + per-consumer
 * rate-limit + namespace isolation.
 */
export async function activatePerConsumerAgents(
  config: PerConsumerActivationConfig,
): Promise<{
  swarmId: string;
  roster: SwarmAgentSpec[];
  namespace: string;
  rateLimitRemaining: number;
}> {
  const namespace = `customer:external-${config.consumerId}`;
  const rateLimitPerHour = config.rateLimitPerHour ?? DEFAULT_RATE_LIMIT;
  if (!config.authToken || config.authToken.length < 8) {
    return {
      swarmId: "rejected",
      roster: [],
      namespace,
      rateLimitRemaining: 0,
    };
  }
  const canonical = getCanonicalRoster();
  return {
    swarmId: `consumer-swarm-${config.consumerId}`,
    roster: canonical.slice(0, DEFAULT_CUSTOMER_AGENTS),
    namespace,
    rateLimitRemaining: rateLimitPerHour, // Phase E Cyl A returns actual remaining quota
  };
}
