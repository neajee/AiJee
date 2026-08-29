const { cp, mkdir, rm } = require("node:fs/promises");
const { join, resolve } = require("node:path");

const root = resolve(__dirname, "..");
const source = join(root, "dist");
const target = join(root, "apps/server/public");

(async () => {
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true });
  console.log(`Copied web assets to ${target}`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
