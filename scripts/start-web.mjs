import { spawn } from "node:child_process";
import { createServer, connect } from "node:net";

const processes = [];

function start(command, args, options = {}) {
  const child = spawn(command, args, { stdio: "inherit", env: process.env, ...options });
  processes.push(child);
  child.once("error", (error) => {
    console.error(`Failed to start ${command}: ${error.message}`);
    shutdown(1);
  });
  return child;
}

function startYarn(args, options = {}) {
  return process.platform === "win32"
    ? start(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", ["yarn.CMD", ...args].join(" ")], options)
    : start("yarn", args, options);
}

function portAvailable(port) {
  return new Promise((resolve) => {
    const connection = connect(port, "127.0.0.1");
    connection.once("connect", () => { connection.destroy(); resolve(false); });
    connection.once("error", () => {
      connection.destroy();
      const probe = createServer();
      probe.once("error", () => resolve(false));
      probe.listen(port, () => probe.close(() => resolve(true)));
    });
  });
}

async function availablePort(start, reserved = new Set()) {
  for (let port = start; port < start + 100; port += 1) {
    if (!reserved.has(port) && await portAvailable(port)) return port;
  }
  throw new Error(`No available development port near ${start}`);
}

async function isAiJeeApi(port) {
  try {
    const signal = AbortSignal.timeout(1000);
    const [health, version] = await Promise.all([
      fetch("http://127.0.0.1:" + port + "/api/health", { signal }),
      fetch("http://127.0.0.1:" + port + "/api/version", { signal }),
    ]);
    return health.ok && version.ok;
  } catch {
    return false;
  }
}

async function isAiJeeProxy(port) {
  try {
    const response = await fetch("http://127.0.0.1:" + port + "/_aijee/dev-health", {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok && (await response.text()) === "ok";
  } catch {
    return false;
  }
}

async function resolveServicePort(start, probe) {
  for (let port = start; port < start + 100; port += 1) {
    if (await probe(port)) return { port, reuse: true };
    if (await portAvailable(port)) return { port, reuse: false };
  }
  throw new Error("No available service port near " + start);
}

async function waitForApi(port) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`AiJee Runtime did not become ready at port ${port}`);
}

const apiResolution = await resolveServicePort(Number(process.env.AIJEE_API_PORT ?? 10088), isAiJeeApi);
const apiPort = apiResolution.port;
const reserved = new Set([apiPort]);
const expoPort = await availablePort(Number(process.env.AIJEE_EXPO_PORT ?? 8082), reserved);
reserved.add(expoPort);
const webResolution = await resolveServicePort(Number(process.env.AIJEE_WEB_PORT ?? 8081), isAiJeeProxy);
if (webResolution.reuse) {
  console.log("AiJee web is already running at http://127.0.0.1:" + webResolution.port);
} else {
  const webPort = webResolution.port;
  const childEnv = {
    ...process.env,
    AIJEE_API_PORT: String(apiPort),
    AIJEE_EXPO_PORT: String(expoPort),
    AIJEE_WEB_PORT: String(webPort),
    EXPO_PUBLIC_AIJEE_EXPO_PORT: String(expoPort),
    EXPO_PUBLIC_AIJEE_WEB_PORT: String(webPort),
  };

  const runtime = apiResolution.reuse
    ? null
    : start("node", ["--experimental-strip-types", "apps/server/src/main.ts", "serve", "--port", String(apiPort)], { env: childEnv });
  runtime?.once("exit", (code) => {
    if (code !== 0) {
      fetch(`http://127.0.0.1:${apiPort}/api/health`)
        .then((response) => { if (!response.ok) shutdown(code ?? 1); })
        .catch(() => shutdown(code ?? 1));
    }
  });
  try {
    await waitForApi(apiPort);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    shutdown(1);
  }
  const expo = startYarn(["workspace", "@aijee/client", "dev", "--port", String(expoPort)], { env: childEnv });
  const proxy = start("node", ["scripts/dev-web-proxy.mjs"], { env: childEnv });
  console.log(`AiJee web: http://127.0.0.1:${webPort} (Expo ${expoPort}, API ${apiPort})`);

  function shutdown(code = 0) {
    for (const child of processes) {
      if (!child.killed) child.kill("SIGTERM");
    }
    process.exit(code);
  }

  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => shutdown());
  expo.once("exit", (code) => shutdown(code ?? 0));
  proxy.once("exit", (code) => shutdown(code ?? 0));
}
