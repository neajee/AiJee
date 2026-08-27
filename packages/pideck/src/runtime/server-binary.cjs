const { createRequire } = require("node:module");
const { existsSync } = require("node:fs");
const { join } = require("node:path");

const requireFromRuntime = createRequire(__filename);

const platformPackages = {
  "darwin-arm64": "@pideck/server-darwin-arm64",
  "darwin-x64": "@pideck/server-darwin-x64",
  "linux-arm64": "@pideck/server-linux-arm64",
  "linux-x64": "@pideck/server-linux-x64",
  "win32-x64": "@pideck/server-win32-x64",
};

function platformKey() {
  return `${process.platform}-${process.arch}`;
}

function resolveServerBinary() {
  if (process.env.PIDECK_SERVER_BIN) return process.env.PIDECK_SERVER_BIN;

  const packageName = platformPackages[platformKey()];
  if (packageName) {
    const binaryName = process.platform === "win32" ? "pideck.exe" : "pideck";
    try {
      return requireFromRuntime.resolve(`${packageName}/bin/${binaryName}`);
    } catch {
      // The platform package is optional and may be unavailable on this host.
    }
  }

  const localBinary = join(
    __dirname,
    "..",
    "..",
    "server",
    "target",
    "debug",
    process.platform === "win32" ? "pideck.exe" : "pideck",
  );
  if (existsSync(localBinary)) return localBinary;

  return "pideck";
}

function supportedPlatform() {
  return platformKey() in platformPackages;
}

module.exports = { platformKey, resolveServerBinary, supportedPlatform };
