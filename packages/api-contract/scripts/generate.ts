import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(fileURLToPath(import.meta.url));
const contractPath = join(packageRoot, "../openapi.yaml");
const routerPath = join(packageRoot, "../../../apps/server/src/api/routes/router.ts");
const generatedPath = join(packageRoot, "../../client-sdk/src/generated/sdk.gen.ts");
const manifestPath = join(packageRoot, "../generated-manifest.json");
const document = JSON.parse(await readFile(contractPath, "utf8")) as {
  openapi?: string;
  paths?: Record<string, Record<string, any>>;
  components?: Record<string, any>;
};
if (document.openapi !== "3.1.0" || !document.paths || Object.keys(document.paths).length < 100) throw new Error("openapi.yaml must contain the frozen AiJee route contract");
for (const path of ["/healthz", "/version"]) document.paths[path] ??= { get: { operationId: path.slice(1) } };

const schemas = document.components?.schemas ?? {};
for (const [path, methods] of Object.entries(document.paths)) for (const [method, operation] of Object.entries(methods)) {
  if (!operation || typeof operation !== "object") continue;
  const response = operation.responses?.["200"];
  const schema = response?.content?.["application/json"]?.schema;
  if (!schema) throw new Error(`Missing JSON response schema: ${method.toUpperCase()} ${path}`);
  if (typeof schema.$ref === "string" && schema.$ref.startsWith("#/components/schemas/")) {
    const name = schema.$ref.slice("#/components/schemas/".length);
    if (!schemas[name]) throw new Error(`Unknown response schema ${name}: ${method.toUpperCase()} ${path}`);
  }
}

const routerSource = await readFile(routerPath, "utf8");
const missing = Object.keys(document.paths).filter((path) => {
  const marker = path.slice(0, path.indexOf("{") >= 0 ? path.indexOf("{") : path.length).replace(/\/$/, "");
  return !routerSource.includes(marker) && !routerSource.includes(marker.replaceAll("/", "\\/"));
});
if (missing.length > 0) throw new Error(`Server router is missing contract paths: ${missing.slice(0, 8).join(", ")}`);

const generatedSource = await readFile(generatedPath, "utf8");
const generatedOperations = generatedSource.split("export const ").slice(1).map((block) => ({
  name: /^(\w+)/.exec(block)?.[1],
  method: /\)\.(get|post|put|patch|delete)/.exec(block)?.[1],
  url: /url:\s*'([^']+)'/.exec(block)?.[1],
})).filter((operation): operation is { name: string; method: string; url: string } => Boolean(operation.name && operation.method && operation.url));
const contractOperations = new Set(Object.entries(document.paths).flatMap(([path, methods]) => Object.keys(methods).map((method) => `${method.toLowerCase()} ${path}`)));
for (const operation of generatedOperations) if (!contractOperations.has(`${operation.method} ${operation.url}`)) throw new Error(`Generated client operation ${operation.name} is missing from openapi.yaml`);
const generatedManifest = generatedOperations.map(({ name, method, url }) => `${method.toUpperCase()} ${url} -> ${name}`).sort();

if (process.argv.includes("--check")) {
  const current = JSON.parse(await readFile(contractPath, "utf8"));
  if (JSON.stringify(current) !== JSON.stringify(document)) throw new Error("openapi.yaml is out of date; run yarn workspace @aijee/api-contract generate");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as string[];
  if (JSON.stringify(manifest) !== JSON.stringify(generatedManifest)) throw new Error("client-sdk generated operation diff detected; regenerate the SDK and contract manifest");
} else {
  await writeFile(contractPath, `${JSON.stringify(document, null, 2)}\n`);
  await writeFile(manifestPath, `${JSON.stringify(generatedManifest, null, 2)}\n`);
  process.stdout.write(`Validated ${Object.keys(document.paths).length} API paths, response schemas, server routes and generated operations\n`);
}
