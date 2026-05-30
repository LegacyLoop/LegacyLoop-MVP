// CMD-W26-C · Send API 24h messaging-window enforcement — proof.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isWindowOpen } from "@/lib/messaging/meta/send";

const NOW = new Date("2026-05-30T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

test("no inbound timestamp → allowed (cannot enforce)", () => {
  assert.equal(isWindowOpen(undefined, false, NOW).allowed, true);
});

test("within 24h → allowed without tag", () => {
  assert.equal(isWindowOpen(hoursAgo(5), false, NOW).allowed, true);
  assert.equal(isWindowOpen(hoursAgo(23), false, NOW).allowed, true);
});

test("beyond 24h without HUMAN_AGENT tag → blocked", () => {
  assert.equal(isWindowOpen(hoursAgo(30), false, NOW).allowed, false);
});

test("beyond 24h with HUMAN_AGENT tag within 7d → allowed", () => {
  assert.equal(isWindowOpen(hoursAgo(30), true, NOW).allowed, true);
  assert.equal(isWindowOpen(hoursAgo(24 * 6), true, NOW).allowed, true);
});

test("beyond 7d even with HUMAN_AGENT tag → blocked", () => {
  assert.equal(isWindowOpen(hoursAgo(24 * 8), true, NOW).allowed, false);
});
