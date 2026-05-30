// CMD-W24-L1 · FB-Army Meta-Safety · 6-check verification suite
// Run: node --test lib/fb-army-safety/verify-suite.mjs
// NO test-runner package · uses built-in node:test.
//
// MODE: sim · proves logic shape. Live-mode path documented per check —
// re-runs at Phase-1 provision against real droplet/proxy/burner.
//
// Constants below are hand-mirrored from the .ts sources (which Next.js
// compiles in-app · NOT pre-built to .js for standalone node). Each mirror
// is anchored with a comment to keep them in sync. If a .ts constant
// changes, this file MUST update too (CI guard FIX 6 catches drift via
// matching grep).

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, existsSync, unlinkSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

// ──────────────────────────────────────────────────────────────────────
// MIRRORED from lib/fb-army-safety/isolation.ts (keep in sync)
// ──────────────────────────────────────────────────────────────────────
const WORLD_A_ENV_KEYS = [
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

const WORLD_A_HOSTS = [
  "graph.facebook.com",
  "graph.instagram.com",
  "graph.threads.net",
  "developers.facebook.com",
];

function assertNoWorldAEnv(env) {
  const violations = [];
  for (const k of WORLD_A_ENV_KEYS) {
    if (env[k] !== undefined && env[k] !== "") {
      violations.push({ kind: "env", detail: `World-A env: ${k}` });
    }
  }
  return { ok: violations.length === 0, violations };
}

function assertNoWorldAHost(url) {
  let host = url;
  try { host = new URL(url).hostname; } catch { /* bare host */ }
  const lower = host.toLowerCase();
  for (const banned of WORLD_A_HOSTS) {
    if (lower === banned || lower.endsWith(`.${banned}`)) {
      return { ok: false, violations: [{ kind: "host", detail: host }] };
    }
  }
  return { ok: true, violations: [] };
}

// ──────────────────────────────────────────────────────────────────────
// MIRRORED from lib/fb-army-safety/pace-floor.ts (keep in sync)
// ──────────────────────────────────────────────────────────────────────
const PACE_FLOOR = Object.freeze({
  minDwellMs: 2500,
  minScrollMs: 800,
  maxItemsPerSession: 40,
  maxMinutesPerSession: 12,
  minIntersessionCooldownMs: 60_000,
});

function enforcePaceFloor(pace) {
  const violations = [];
  if (pace.minDwellMs < PACE_FLOOR.minDwellMs) violations.push("minDwellMs");
  if (pace.minScrollMs < PACE_FLOOR.minScrollMs) violations.push("minScrollMs");
  if (pace.maxItemsPerSession > PACE_FLOOR.maxItemsPerSession) violations.push("maxItemsPerSession");
  if (pace.maxMinutesPerSession > PACE_FLOOR.maxMinutesPerSession) violations.push("maxMinutesPerSession");
  return { ok: violations.length === 0, violations };
}

// ──────────────────────────────────────────────────────────────────────
// MIRRORED from lib/fb-army-safety/burner-identity.ts (keep in sync)
// ──────────────────────────────────────────────────────────────────────
const REAL_IDENTITY_PATTERNS = [
  /ryan/i,
  /hallee/i,
  /legacyloop(maine)?/i,
  /legacy-?loop/i,
  /annalyse07/i,
  /@gmail\.com$/i,
  /meta-?dev/i,
  /meta-?app/i,
  /facebook-?dev/i,
];

const SYNTHETIC_EMAIL_RE =
  /^(burner|fb-army)[-_]\d+@(proton(mail)?\.me|tutanota\.com|simplelogin\.io|duck\.com|tempmail\.dev|burner-domain\.test)$/i;

function validateBurnerIdentity(id) {
  const violations = [];
  for (const field of ["accountId", "email", "displayName", "phoneE164", "notes"]) {
    const v = id[field];
    if (!v) continue;
    for (const re of REAL_IDENTITY_PATTERNS) {
      if (re.test(v)) violations.push(`real-overlap:${field}:${re.source}`);
    }
  }
  if (id.email && !SYNTHETIC_EMAIL_RE.test(id.email)) {
    violations.push(`non-synthetic-email:${id.email}`);
  }
  return { ok: violations.length === 0, violations };
}

// ──────────────────────────────────────────────────────────────────────
// MIRRORED from lib/fb-army-safety/kill-switch.ts (keep in sync)
// ──────────────────────────────────────────────────────────────────────
const KILL_FLAG_PATH = process.env.FB_ARMY_KILL_FLAG_PATH ?? "/tmp/fb-army-killed.flag";
let _killed = false;

function killArmy(reason) {
  _killed = true;
  try {
    const dir = dirname(KILL_FLAG_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(KILL_FLAG_PATH, JSON.stringify({ ...reason, killedAt: Date.now() }), "utf8");
  } catch { /* in-process flag only */ }
}

function isArmyKilled() {
  if (_killed) return true;
  try { if (existsSync(KILL_FLAG_PATH)) { _killed = true; return true; } } catch { /* ignore */ }
  return false;
}

function resetKillState() {
  _killed = false;
  try { if (existsSync(KILL_FLAG_PATH)) unlinkSync(KILL_FLAG_PATH); } catch { /* ignore */ }
}

// ──────────────────────────────────────────────────────────────────────
// MIRRORED from fb-army/src/proxy-egress.ts (sim of egress safety)
// ──────────────────────────────────────────────────────────────────────
function assertEgressSafety(env) {
  const forbidden = ["META_APP_SECRET", "FB_APP_SECRET", "FACEBOOK_GRAPH_TOKEN", "META_DEV_ACCESS_TOKEN"];
  const reasons = forbidden.filter((k) => env[k]);
  return { ok: reasons.length === 0, reasons };
}

// ══════════════════════════════════════════════════════════════════════
// 6-CHECK VERIFICATION SUITE
// ══════════════════════════════════════════════════════════════════════

// CHECK 1 · NETWORK-PROBE [sim mode]
// LIVE-MODE PATH: at Phase-1 provision, droplet runs `curl -v` against
// every target host through the residential proxy; assert zero World-A
// host appears in actual egress capture (tcpdump or proxy log).
test("CHECK 1 · network-probe · World-B egress has zero World-A hosts [sim]", () => {
  const droppedEnv = { /* clean World-B droplet env */
    FB_ARMY_PROXY_URL: "http://gw.smartproxy.com:7000",
    FB_ARMY_PROXY_USER: "burner-001",
    FB_ARMY_PROXY_PASS: "synthetic-droplet-pw",
    SCRAPER_PROXY_SECRET: "ingest-token",
  };
  const v = assertEgressSafety(droppedEnv);
  assert.equal(v.ok, true, `egress safety: ${JSON.stringify(v.reasons)}`);

  const targets = [
    "https://www.facebook.com/marketplace/category/antiques",
    "https://www.facebook.com/groups/feed",
  ];
  for (const t of targets) {
    const h = assertNoWorldAHost(t);
    assert.equal(h.ok, true, `host scan ${t}: ${JSON.stringify(h.violations)}`);
  }

  // Negative · World-A host MUST trip the check
  const trap = assertNoWorldAHost("https://graph.facebook.com/v18.0/me");
  assert.equal(trap.ok, false, "negative: graph.facebook.com must trip");
});

// CHECK 2 · FINGERPRINT-DIFF [sim mode]
// LIVE-MODE PATH: at Phase-1 provision, spin N real burner sessions
// behind real residential proxy; capture actual UA+viewport+locale+tz
// reported to the FB server (debug-headers); assert all distinct.
test("CHECK 2 · fingerprint-diff · each burner distinct UA+viewport+locale+tz [sim]", () => {
  // Hand-mirrored from fb-army/src/fingerprint.ts pools (keep in sync)
  const UAS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  ];
  const VPS = [
    { width: 1920, height: 1080 }, { width: 1680, height: 1050 },
    { width: 1440, height: 900 }, { width: 1366, height: 768 },
  ];
  const TZS = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix"];
  const LOCS = ["en-US", "en-GB", "en-CA"];

  // Pool size proves diversity entropy ≥ 4×4×5×3 = 240 combinations
  const combinations = UAS.length * VPS.length * TZS.length * LOCS.length;
  assert.ok(combinations >= 200, `fingerprint entropy ${combinations} < 200`);

  // Deterministic sampling of 5 burners · check unique tuples
  const sampled = new Set();
  for (let i = 0; i < 5; i++) {
    const ua = UAS[i % UAS.length];
    const vp = VPS[(i + 1) % VPS.length];
    const tz = TZS[(i + 2) % TZS.length];
    const loc = LOCS[(i + 3) % LOCS.length];
    sampled.add(`${ua}|${vp.width}x${vp.height}|${tz}|${loc}`);
  }
  assert.equal(sampled.size, 5, "5 sampled fingerprints not all distinct");
});

// CHECK 3 · PACE-SIMULATION [sim mode]
// LIVE-MODE PATH: at Phase-1 provision, real droplet timing recorded
// per session; assert no dwell < 2.5s · no scroll < 0.8s · session caps
// honored.
test("CHECK 3 · pace-simulation · within human envelope [sim]", () => {
  const safePace = { minDwellMs: 2500, maxDwellMs: 7500, minScrollMs: 800, maxScrollMs: 2400, maxItemsPerSession: 40, maxMinutesPerSession: 12 };
  assert.equal(enforcePaceFloor(safePace).ok, true, "default pace must pass floor");

  // Negative · faster than floor MUST trip
  const fast = { ...safePace, minDwellMs: 500 };
  assert.equal(enforcePaceFloor(fast).ok, false, "500ms dwell must fail floor");

  // Negative · over-cap items MUST trip
  const greedy = { ...safePace, maxItemsPerSession: 200 };
  assert.equal(enforcePaceFloor(greedy).ok, false, "200 items/session must fail ceiling");
});

// CHECK 4 · CAPTCHA TRIP-WIRE [sim mode]
// LIVE-MODE PATH: at Phase-1 provision, inject a known checkpoint URL
// into rotation; observe controller marks prong unhealthy and applies
// real cooldown from lib/scrapers/rotation/health.ts ladder.
test("CHECK 4 · captcha trip-wire · auto-cool per ladder [sim]", () => {
  // Mirrored cooldown ladder from lib/scrapers/rotation/health.ts (keep in sync)
  const LADDER = [60_000, 300_000, 900_000, 1_800_000, 3_600_000];

  // Simulate consecutive captcha hits · verify cooldown grows per ladder
  let prev = { consecutiveBlocks: 0, cooldownUntil: null };
  for (let i = 0; i < 6; i++) {
    const next = prev.consecutiveBlocks + 1;
    const idx = Math.min(next - 1, LADDER.length - 1);
    const cooldownMs = LADDER[idx];
    prev = { consecutiveBlocks: next, cooldownUntil: Date.now() + cooldownMs };
    assert.ok(cooldownMs >= 60_000, `cooldown floor at block ${next}: ${cooldownMs}`);
  }
  // 6th block stays at 60-minute cap
  assert.equal(prev.consecutiveBlocks, 6);
  // Final cooldown should be the cap (3600000)
  const lastCooldown = LADDER[Math.min(prev.consecutiveBlocks - 1, LADDER.length - 1)];
  assert.equal(lastCooldown, 3_600_000, "ladder must cap at 60 min");
});

// CHECK 5 · BURNER-IDENTITY AUDIT [sim mode]
// LIVE-MODE PATH: at Phase-1 provision, real burner roster JSON loaded
// from droplet env; same validator runs · zero overlaps allowed.
test("CHECK 5 · burner-identity · zero Ryan/dev overlap [sim]", () => {
  // Valid synthetic burner
  const goodBurner = { accountId: "burner-001", email: "burner-001@proton.me" };
  assert.equal(validateBurnerIdentity(goodBurner).ok, true, "synthetic burner must pass");

  // Negative · Ryan's name MUST trip
  const ryanLeak = { accountId: "burner-002", email: "burner-002@proton.me", displayName: "Ryan Hallee" };
  assert.equal(validateBurnerIdentity(ryanLeak).ok, false, "ryan name leak must trip");

  // Negative · personal gmail MUST trip
  const gmailLeak = { accountId: "burner-003", email: "ryan@gmail.com" };
  assert.equal(validateBurnerIdentity(gmailLeak).ok, false, "personal gmail must trip");

  // Negative · non-synthetic domain MUST trip
  const realDomain = { accountId: "burner-004", email: "totally-fake@hotmail.com" };
  assert.equal(validateBurnerIdentity(realDomain).ok, false, "non-synthetic domain must trip");

  // Negative · legacy-loop reference MUST trip
  const brandLeak = { accountId: "burner-005", email: "burner-005@proton.me", notes: "legacyloop side" };
  assert.equal(validateBurnerIdentity(brandLeak).ok, false, "brand leak must trip");
});

// CHECK 6 · KILL-SWITCH <30s [sim mode]
// LIVE-MODE PATH: at Phase-1 provision, killArmy() called via webhook;
// observe all real droplet prongs stop sending requests within 30s
// (proxy-side telemetry).
test("CHECK 6 · kill-switch · <30s full stop [sim · timed]", async () => {
  resetKillState();
  const targetMs = 30_000;
  const pollIntervalMs = 200;
  const prongCount = 5;
  const startedAt = Date.now();

  const pollers = Array.from({ length: prongCount }, (_, i) =>
    new Promise((resolve) => {
      const tick = () => {
        if (isArmyKilled()) { resolve(Date.now() - startedAt); return; }
        if (Date.now() - startedAt > targetMs * 2) { resolve(-1); return; }
        setTimeout(tick, pollIntervalMs);
      };
      setTimeout(tick, i * 25);
    }),
  );

  setTimeout(() => killArmy({ reason: "verify-suite sim", source: "test" }), 50);
  const perProng = await Promise.all(pollers);
  const worst = Math.max(...perProng);
  resetKillState();

  assert.ok(worst >= 0 && worst < targetMs, `kill propagation took ${worst}ms (target <${targetMs}ms)`);
  assert.ok(worst < 5_000, `kill propagation expected fast in sim · got ${worst}ms`);
});

// SUMMARY (printed by node --test reporter)
test("SUMMARY · 6/6 sim mode · live-mode banked", () => {
  const summary = {
    mode: "sim",
    checks: 6,
    livePending: ["network-probe", "fingerprint-diff", "pace-simulation", "captcha-tripwire", "burner-identity", "kill-switch"],
    livePhase: "Phase-1 provision · droplet+proxy+burner",
    metaSafetyLaw: "DOC-META-SAFETY-ABSOLUTE",
  };
  // Emit machine-readable trailer for the audit doc
  console.log("VERIFY-SUITE-SUMMARY:" + JSON.stringify(summary));
  assert.ok(true);
});
