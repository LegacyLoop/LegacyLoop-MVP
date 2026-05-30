// CMD-W24-L1 · FB-Army Meta-Safety · World-A↔World-B firewall (runtime assertion)
// ABSOLUTE: World-B droplet army MUST NEVER carry any World-A (Meta Graph API)
// credential, host, endpoint, or symbol. Violation = refuse-to-run.
//
// Companion to compile-time/CI grep guard (scripts/fb-army-safety-guard.sh).
// Companion to existing fb-army/src/proxy-egress.ts `assertEgressSafety()`.

/** Env keys that ONLY belong to World-A (Meta Graph API · official channel). */
export const WORLD_A_ENV_KEYS: ReadonlyArray<string> = [
  "META_APP_SECRET",
  "META_APP_ID",
  "META_DEV_ACCESS_TOKEN",
  "META_GRAPH_TOKEN",
  "FB_APP_SECRET",
  "FB_APP_ID",
  "FB_GRAPH_TOKEN",
  "FACEBOOK_APP_SECRET",
  "FACEBOOK_GRAPH_TOKEN",
  "FACEBOOK_OAUTH_TOKEN",
];

/** Hostnames/domains that ONLY belong to World-A (Graph API endpoints). */
export const WORLD_A_HOSTS: ReadonlyArray<string> = [
  "graph.facebook.com",
  "graph.instagram.com",
  "graph.threads.net",
  "developers.facebook.com",
];

/** Module path fragments that are World-A-only (Meta Graph adapters). */
export const WORLD_A_MODULE_FRAGMENTS: ReadonlyArray<string> = [
  "meta-graph",
  "meta-dev",
  "lib/adapters/meta",
  "lib/meta-graph",
];

export type IsolationViolation = {
  readonly kind: "env" | "host" | "module" | "world-mismatch";
  readonly detail: string;
};

export type IsolationVerdict = {
  readonly ok: boolean;
  readonly violations: ReadonlyArray<IsolationViolation>;
};

/**
 * Assert no World-A env var is set in current process. If any are present and
 * caller claims World-B context, refuse to run.
 */
export function assertNoWorldAEnv(env: NodeJS.ProcessEnv = process.env): IsolationVerdict {
  const violations: IsolationViolation[] = [];
  for (const k of WORLD_A_ENV_KEYS) {
    if (env[k] !== undefined && env[k] !== "") {
      violations.push({
        kind: "env",
        detail: `World-A env present in World-B context: ${k}`,
      });
    }
  }
  return { ok: violations.length === 0, violations };
}

/**
 * Assert a target URL/host does not point at a World-A endpoint.
 */
export function assertNoWorldAHost(targetUrl: string): IsolationVerdict {
  const violations: IsolationViolation[] = [];
  let host = targetUrl;
  try {
    host = new URL(targetUrl).hostname;
  } catch {
    // bare host or non-url string · check substring match below
  }
  const lower = host.toLowerCase();
  for (const banned of WORLD_A_HOSTS) {
    if (lower === banned || lower.endsWith(`.${banned}`)) {
      violations.push({
        kind: "host",
        detail: `World-A host in World-B request: ${host}`,
      });
    }
  }
  return { ok: violations.length === 0, violations };
}

/**
 * Assert a module specifier does not import World-A symbols.
 */
export function assertNoWorldAModule(modulePath: string): IsolationVerdict {
  const violations: IsolationViolation[] = [];
  const lower = modulePath.toLowerCase();
  for (const frag of WORLD_A_MODULE_FRAGMENTS) {
    if (lower.includes(frag)) {
      violations.push({
        kind: "module",
        detail: `World-A module import in World-B code: ${modulePath}`,
      });
    }
  }
  return { ok: violations.length === 0, violations };
}

/**
 * Composite assertion · run before any World-B prong activation.
 * Pass current process env + the prong's declared world + the target URL.
 */
export function assertNoWorldAReference(opts: {
  prongWorld: "A" | "B" | "apify";
  targetUrl?: string;
  modulePath?: string;
  env?: NodeJS.ProcessEnv;
}): IsolationVerdict {
  if (opts.prongWorld === "A") {
    return { ok: true, violations: [] };
  }
  const violations: IsolationViolation[] = [];
  const envVerdict = assertNoWorldAEnv(opts.env ?? process.env);
  violations.push(...envVerdict.violations);
  if (opts.targetUrl) {
    const hostVerdict = assertNoWorldAHost(opts.targetUrl);
    violations.push(...hostVerdict.violations);
  }
  if (opts.modulePath) {
    const modVerdict = assertNoWorldAModule(opts.modulePath);
    violations.push(...modVerdict.violations);
  }
  return { ok: violations.length === 0, violations };
}
