import { spawn } from "node:child_process";

const processes = [];

function start(command, args) {
  const child = spawn(command, args, { stdio: "inherit", env: process.env });
  processes.push(child);
  return child;
}

const runtime = start("node", ["--experimental-strip-types", "apps/server/src/main.ts", "serve"]);
const expo = start("yarn", ["workspace", "@aijee/client", "dev", "--port", "8082"]);
const proxy = start("node", ["tools/dev-web-proxy.mjs"]);

function shutdown(code = 0) {
  for (const child of processes) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => shutdown());
runtime.once("exit", () => {});
expo.once("exit", (code) => shutdown(code ?? 0));
proxy.once("exit", (code) => shutdown(code ?? 0));
