/**
 * @deprecated CMD-W27-A · World-B wind-down (2026-05-30).
 * Fingerprint-evasion entropy (UA/viewport/timezone/locale randomization) =
 * Meta ToS ban-evasion · DO NOT ACTIVATE. Retained @deprecated for git history.
 * Salvage: human-pace throttle primitives (humanDwell/humanScroll/jitter) =
 * generic timing utilities — safe to reuse outside ban-evasion context.
 */
// fb-army · World-B · droplet runtime · fingerprint randomization [DEPRECATED W27-A]
// Per-session entropy: UA · viewport · timezone · locale · human-pace throttle
// ZERO World-A reference · ZERO Meta dev account · ZERO repo creds

export type Fingerprint = {
  userAgent: string;
  viewport: { width: number; height: number };
  timezoneId: string;
  locale: string;
  deviceScaleFactor: number;
  acceptLanguage: string;
};

const USER_AGENTS: ReadonlyArray<string> = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
];

const VIEWPORTS: ReadonlyArray<{ width: number; height: number }> = [
  { width: 1920, height: 1080 },
  { width: 1680, height: 1050 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
];

const TIMEZONES: ReadonlyArray<string> = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
];

const LOCALES: ReadonlyArray<string> = ["en-US", "en-GB", "en-CA"];

function pick<T>(arr: ReadonlyArray<T>): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function rollFingerprint(): Fingerprint {
  const locale = pick(LOCALES);
  return {
    userAgent: pick(USER_AGENTS),
    viewport: pick(VIEWPORTS),
    timezoneId: pick(TIMEZONES),
    locale,
    deviceScaleFactor: Math.random() < 0.5 ? 1 : 2,
    acceptLanguage: `${locale},${locale.split("-")[0]};q=0.9`,
  };
}

// Human-pace throttle · randomized dwell + scroll + session cap
export type PaceProfile = {
  minDwellMs: number;
  maxDwellMs: number;
  minScrollMs: number;
  maxScrollMs: number;
  maxItemsPerSession: number;
  maxMinutesPerSession: number;
};

export const DEFAULT_PACE: PaceProfile = {
  minDwellMs: 2500,
  maxDwellMs: 7500,
  minScrollMs: 800,
  maxScrollMs: 2400,
  maxItemsPerSession: 40,
  maxMinutesPerSession: 12,
};

export function jitter(minMs: number, maxMs: number): number {
  return minMs + Math.floor(Math.random() * (maxMs - minMs));
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function humanDwell(pace: PaceProfile = DEFAULT_PACE): Promise<void> {
  await sleep(jitter(pace.minDwellMs, pace.maxDwellMs));
}

export async function humanScroll(pace: PaceProfile = DEFAULT_PACE): Promise<void> {
  await sleep(jitter(pace.minScrollMs, pace.maxScrollMs));
}
