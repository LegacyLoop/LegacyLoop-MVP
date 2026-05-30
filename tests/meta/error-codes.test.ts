// CMD-W26-C · Meta error-code classification — 8-code routing proof.
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMetaError, isRetryable } from "@/lib/meta/messenger/error-codes";

const EXPECTED: Record<number, string> = {
  190: "REAUTH",
  200: "PERMISSION",
  100: "INVALID",
  4: "BACKOFF",
  17: "BACKOFF",
  32: "BACKOFF",
  613: "BACKOFF",
  368: "POLICY_PAUSE",
};

test("all 8 spec codes map to the correct action", () => {
  for (const [code, action] of Object.entries(EXPECTED)) {
    assert.equal(classifyMetaError(Number(code)).action, action, `code ${code}`);
  }
});

test("rate-limit codes are retryable, auth/permission/invalid are not", () => {
  assert.equal(isRetryable(4), true);
  assert.equal(isRetryable(613), true);
  assert.equal(isRetryable(190), false);
  assert.equal(isRetryable(200), false);
  assert.equal(isRetryable(100), false);
});

test("unmapped code → UNKNOWN, non-retryable", () => {
  const c = classifyMetaError(99999);
  assert.equal(c.action, "UNKNOWN");
  assert.equal(c.retryable, false);
});

test("token subcode 463/467 → REAUTH even under generic code", () => {
  assert.equal(classifyMetaError(1, 463).action, "REAUTH");
  assert.equal(classifyMetaError(1, 467).action, "REAUTH");
});
