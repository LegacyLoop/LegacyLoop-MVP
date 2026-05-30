// CMD-W26-C · Webhook event idempotency — replay dedup proof.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isDuplicateEvent, resetDedupStore, dedupSize } from "@/lib/meta/webhooks/event-dedup";

test("first sight is not a duplicate, replay is", () => {
  resetDedupStore();
  assert.equal(isDuplicateEvent("mid_abc"), false);
  assert.equal(isDuplicateEvent("mid_abc"), true);
  assert.equal(isDuplicateEvent("mid_abc"), true);
});

test("distinct ids are independent", () => {
  resetDedupStore();
  assert.equal(isDuplicateEvent("a"), false);
  assert.equal(isDuplicateEvent("b"), false);
  assert.equal(dedupSize(), 2);
});

test("empty id is never deduped (cannot key)", () => {
  resetDedupStore();
  assert.equal(isDuplicateEvent(""), false);
  assert.equal(isDuplicateEvent(""), false);
});

test("entry expires after TTL", () => {
  resetDedupStore();
  const t0 = 1_000_000;
  assert.equal(isDuplicateEvent("x", t0), false);
  assert.equal(isDuplicateEvent("x", t0 + 60_000), true); // within TTL
  assert.equal(isDuplicateEvent("x", t0 + 11 * 60_000), false); // past 10m TTL → fresh
});
