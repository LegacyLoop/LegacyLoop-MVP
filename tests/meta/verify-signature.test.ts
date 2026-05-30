// CMD-W26-C · HMAC webhook signature verification — tamper-reject proof.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyMetaSignature } from "@/lib/messaging/meta/verify-signature";

const SECRET = "test_app_secret_123";
const BODY = JSON.stringify({ object: "page", entry: [{ id: "1", time: 1 }] });

function sign(body: string, secret = SECRET): string {
  return "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

test("valid signature passes", () => {
  assert.equal(verifyMetaSignature(BODY, sign(BODY), SECRET), true);
});

test("tampered body rejected", () => {
  const tampered = BODY.replace('"page"', '"instagram"');
  assert.equal(verifyMetaSignature(tampered, sign(BODY), SECRET), false);
});

test("wrong secret rejected", () => {
  assert.equal(verifyMetaSignature(BODY, sign(BODY, "other_secret"), SECRET), false);
});

test("missing header rejected", () => {
  assert.equal(verifyMetaSignature(BODY, null, SECRET), false);
});

test("malformed header (no sha256= prefix) rejected", () => {
  assert.equal(verifyMetaSignature(BODY, "deadbeef", SECRET), false);
});

test("empty app secret rejected", () => {
  assert.equal(verifyMetaSignature(BODY, sign(BODY), ""), false);
});
