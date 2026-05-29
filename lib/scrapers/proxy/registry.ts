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

const REGISTRY: Record<ProviderName, Adapter> = {
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
};

export function getAdapter(provider: ProviderName): Adapter | null {
  return REGISTRY[provider] ?? null;
}

export function listEnabledAdapters(): ReadonlyArray<{
  provider: ProviderName;
  operations: ReadonlyArray<OperationName>;
}> {
  return (Object.keys(REGISTRY) as ProviderName[])
    .filter((p) => REGISTRY[p].enabled)
    .map((p) => ({
      provider: p,
      operations: REGISTRY[p].operations,
    }));
}
