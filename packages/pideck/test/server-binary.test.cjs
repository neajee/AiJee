const assert = require("node:assert/strict");
const test = require("node:test");
const { platformKey, resolveServerBinary, supportedPlatform } = require("../src/runtime/server-binary.cjs");

test("reports the current platform", () => {
  assert.equal(platformKey(), `${process.platform}-${process.arch}`);
  assert.equal(typeof supportedPlatform(), "boolean");
});

test("honors an explicit server binary", () => {
  const previous = process.env.PIDECK_SERVER_BIN;
  process.env.PIDECK_SERVER_BIN = "/tmp/pideck-test";
  assert.equal(resolveServerBinary(), "/tmp/pideck-test");
  if (previous === undefined) delete process.env.PIDECK_SERVER_BIN;
  else process.env.PIDECK_SERVER_BIN = previous;
});
