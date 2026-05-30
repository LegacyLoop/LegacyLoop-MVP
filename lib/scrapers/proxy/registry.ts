import type { ProviderName, OperationName } from "./types";
import type { Adapter } from "./base";
import { shippoAdapter } from "./adapters/shippo";
import { easypostAdapter } from "./adapters/easypost";
import { fedexDirectAdapter } from "./adapters/fedex-direct";
import { amazonPaapiAdapter } from "./adapters/amazon-paapi";
import { redditOauthAdapter } from "./adapters/reddit-oauth";
import { upsAdapter } from "./adapters/ups";
import { uspsAdapter } from "./adapters/usps";
import { dhlAdapter } from "./adapters/dhl";
import { rainforestAdapter } from "./adapters/rainforest";
import { metaAdapter } from "./adapters/meta";
import { apifyAdapter } from "./adapters/apify";
import { shipstationAdapter } from "./adapters/shipstation";
// CMD-W27-A · World-B wind-down · fbArmyAdapter removed from registry.
// Adapter file retained @deprecated for git history. Provider key "fb-army"
// kept in ProviderName union (back-compat) but no longer registered — calls
// to getAdapter("fb-army") return null (fail-closed).

const REGISTRY: Partial<Record<ProviderName, Adapter>> = {
  shippo: shippoAdapter,
  easypost: easypostAdapter,
  "fedex-direct": fedexDirectAdapter,
  "amazon-paapi": amazonPaapiAdapter,
  "reddit-oauth": redditOauthAdapter,
  ups: upsAdapter,
  usps: uspsAdapter,
  dhl: dhlAdapter,
  rainforest: rainforestAdapter,
  meta: metaAdapter,
  apify: apifyAdapter,
  shipstation: shipstationAdapter,
};

export function getAdapter(provider: ProviderName): Adapter | null {
  return REGISTRY[provider] ?? null;
}

export function listEnabledAdapters(): ReadonlyArray<{
  provider: ProviderName;
  operations: ReadonlyArray<OperationName>;
}> {
  return (Object.keys(REGISTRY) as ProviderName[])
    .filter((p) => REGISTRY[p]?.enabled === true)
    .map((p) => ({
      provider: p,
      operations: REGISTRY[p]!.operations,
    }));
}
