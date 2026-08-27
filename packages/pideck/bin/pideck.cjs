#!/usr/bin/env node

const { spawn } = require("node:child_process");
const { resolveServerBinary } = require("../src/runtime/server-binary.cjs");

const child = spawn(resolveServerBinary(), process.argv.slice(2), {
  stdio: "inherit",
});

child.once("error", (error) => {
  console.error(`Unable to start PiDeck: ${error.message}`);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
