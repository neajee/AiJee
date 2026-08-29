import assert from "node:assert/strict";
import test from "node:test";
import { normalizeImageAttachments } from "../src/api/prompt-images.ts";

test("base64 attachments pass through with their mime type", () => {
  assert.deepEqual(
    normalizeImageAttachments([{ type: "image", data: "AAAB", mimeType: "image/jpeg" }]),
    [{ type: "image", data: "AAAB", mimeType: "image/jpeg" }],
  );
});

test("a whole data URL is split instead of sent as image bytes", () => {
  assert.deepEqual(
    normalizeImageAttachments([{ data: "data:image/webp;base64,QUJD" }]),
    [{ type: "image", data: "QUJD", mimeType: "image/webp" }],
  );
});

test("wrapped base64 is flattened and a non-image mime type is corrected", () => {
  assert.deepEqual(
    normalizeImageAttachments([{ data: "QUJ\nD ", mimeType: "application/octet-stream" }]),
    [{ type: "image", data: "QUJD", mimeType: "image/png" }],
  );
});

test("unusable entries are dropped without failing the prompt", () => {
  assert.equal(normalizeImageAttachments(undefined), undefined);
  assert.equal(normalizeImageAttachments([]), undefined);
  assert.equal(normalizeImageAttachments([{ data: "" }, null, "nope"]), undefined);
  assert.deepEqual(
    normalizeImageAttachments([{ data: "" }, { data: "QQ==", mimeType: "image/png" }]),
    [{ type: "image", data: "QQ==", mimeType: "image/png" }],
    "one bad attachment does not take the good one with it",
  );
});

test("an oversized payload is refused rather than forwarded to the model", () => {
  const huge = "A".repeat(13 * 1024 * 1024);
  assert.equal(normalizeImageAttachments([{ data: huge, mimeType: "image/png" }]), undefined);
});
