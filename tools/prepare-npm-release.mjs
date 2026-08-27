import { chmod, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [artifactsDir, outputDir, version] = process.argv.slice(2);

if (!artifactsDir || !outputDir || !version) {
  throw new Error("Usage: node tools/prepare-npm-release.mjs <artifacts> <output> <version>");
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const platforms = [
  { key: "linux-x64", os: "linux", cpu: "x64", artifact: "pideck-linux-x86_64", binary: "pideck" },
  { key: "linux-arm64", os: "linux", cpu: "arm64", artifact: "pideck-linux-aarch64", binary: "pideck" },
  { key: "darwin-x64", os: "darwin", cpu: "x64", artifact: "pideck-macos-x86_64", binary: "pideck" },
  { key: "darwin-arm64", os: "darwin", cpu: "arm64", artifact: "pideck-macos-aarch64", binary: "pideck" },
  { key: "win32-x64", os: "win32", cpu: "x64", artifact: "pideck-windows-x86_64.exe", binary: "pideck.exe" },
];

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`);

for (const { key, os, cpu, artifact, binary } of platforms) {
  const packageJson = {
    name: `@pideck/server-${key}`,
    version,
    description: `PiDeck Server binary for ${key}`,
    license: "MIT",
    os: [os],
    cpu: [cpu],
    files: ["bin"],
    bin: { pideck: `bin/${binary}` },
    publishConfig: { access: "public" },
  };
  const destination = join(outputDir, packageJson.name);
  await mkdir(join(destination, "bin"), { recursive: true });
  await writeJson(join(destination, "package.json"), packageJson);
  await cp(join(artifactsDir, artifact, binary), join(destination, "bin", binary));
  if (binary !== "pideck.exe") await chmod(join(destination, "bin", binary), 0o755);
}

const pluginDir = join(outputDir, "pideck");
const pluginPackage = await readJson(join(root, "packages/pideck/package.json"));
pluginPackage.version = version;
pluginPackage.optionalDependencies = Object.fromEntries(
  platforms.map(({ key }) => [`@pideck/server-${key}`, version]),
);
delete pluginPackage.devDependencies;
delete pluginPackage.scripts;
await mkdir(pluginDir, { recursive: true });
await writeJson(join(pluginDir, "package.json"), pluginPackage);
await cp(join(root, "packages/pideck/README.md"), join(pluginDir, "README.md"));
await cp(join(root, "packages/pideck/src"), join(pluginDir, "src"), { recursive: true });
await cp(join(root, "packages/pideck/bin"), join(pluginDir, "bin"), { recursive: true });
await chmod(join(pluginDir, "bin", "pideck.cjs"), 0o755);

console.log(`Prepared ${platforms.length + 1} npm packages in ${outputDir}`);
