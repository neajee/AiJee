import assert from "node:assert/strict";
import test from "node:test";
import { sameOriginBaseUrl } from "../src/utils/runtime-base-url.ts";

test("uses the current HTTP origin for web requests", () => {
  assert.equal(sameOriginBaseUrl({ origin: "http://127.0.0.1:10088", protocol: "http:" }), "http://127.0.0.1:10088");
  assert.equal(sameOriginBaseUrl({ origin: "https://aijee.example.com", protocol: "https:" }), "https://aijee.example.com");
});

test("leaves native and non-HTTP runtimes unconfigured", () => {
  assert.equal(sameOriginBaseUrl(), undefined);
  assert.equal(sameOriginBaseUrl({ origin: "file://", protocol: "file:" }), undefined);
});
