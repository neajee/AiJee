import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const [outputDir, version] = process.argv.slice(2);
if (!outputDir || !version) throw new Error("Usage: node scripts/prepare-npm-release.mjs <output> <version>");

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const destination = join(outputDir, "aijee");
const packageJson = JSON.parse(await readFile(join(root, "apps/server/package.json"), "utf8"));
packageJson.version = version;
delete packageJson.devDependencies;
delete packageJson.scripts;
delete packageJson.dependencies?.["@aijee/engine"];
packageJson.dependencies = { ...(packageJson.dependencies ?? {}), "@earendil-works/pi-coding-agent": "0.84.3" };
await mkdir(destination, { recursive: true });
await writeFile(join(destination, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
await cp(join(root, "apps/server/README.md"), join(destination, "README.md"));
await cp(join(root, "apps/server/bin"), join(destination, "bin"), { recursive: true });
await cp(join(root, "apps/server/src"), join(destination, "src"), { recursive: true });
await cp(join(root, "packages/engine/src"), join(destination, "src/engine"), { recursive: true });
for (const file of ["src/api/http-server.ts", "src/runtime.ts", "src/sessions/registry.ts"]) {
  const target = join(destination, file);
  const source = await readFile(target, "utf8");
  await writeFile(target, source.replaceAll('"@aijee/engine"', '"../engine/index.ts"'));
}
const publicRoot = join(root, "apps/server/public");
try { await cp(publicRoot, join(destination, "public"), { recursive: true }); } catch { /* web assets may be built by npm prepack */ }
console.log("Prepared aijee npm package");
