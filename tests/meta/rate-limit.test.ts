// CMD-W26-C · Rate-limit backoff at 60% cap — proof.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decideBackoff, BACKOFF_UTIL_PCT } from "@/lib/meta/messenger/rate-limit";

function headersWith(buc: unknown): Headers {
  const h = new Headers();
  h.set("x-business-use-case-usage", JSON.stringify(buc));
  return h;
}

test("no usage headers → no backoff", () => {
  const d = decideBackoff(new Headers());
  assert.equal(d.backoff, false);
  assert.equal(d.utilPct, 0);
});

test("utilisation below cap → no backoff", () => {
  const d = decideBackoff(headersWith({ "biz1": [{ call_count: 40, total_time: 30, total_cputime: 10 }] }));
  assert.equal(d.backoff, false);
  assert.equal(d.utilPct, 40);
});

test("utilisation at/above 60% cap → backoff with wait", () => {
  const d = decideBackoff(headersWith({ "biz1": [{ call_count: 75, total_time: 50, total_cputime: 20 }] }));
  assert.equal(d.backoff, true);
  assert.equal(d.utilPct, 75);
  assert.ok(d.waitMs > 0);
});

test("explicit regain hint forces backoff regardless of percent", () => {
  const d = decideBackoff(headersWith({ "biz1": [{ call_count: 5, estimated_time_to_regain_access: 3 }] }));
  assert.equal(d.backoff, true);
  assert.equal(d.waitMs, 3 * 60_000);
});

test("cap constant is 60", () => {
  assert.equal(BACKOFF_UTIL_PCT, 60);
});
