import { build } from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

await build({
  entryPoints: [resolve(root, "apps/server/src/bin/aijee.ts")],
  outfile: resolve(root, "apps/desktop/dist-runtime/aijee.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  alias: { "@aijee/engine": resolve(root, "packages/engine/src/index.ts") },
});
