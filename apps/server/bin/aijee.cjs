const { spawnSync } = require("node:child_process");
const { join } = require("node:path");

const entry = join(__dirname, "../src/bin/aijee.ts");
const result = spawnSync(process.execPath, ["--experimental-strip-types", entry, ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(result.status ?? 1);
