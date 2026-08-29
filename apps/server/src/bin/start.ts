import { runCli } from "../cli/commands.ts";

void runCli(["serve", ...process.argv.slice(2)]).catch((error) => {
  process.stderr.write(`Unable to start AiJee: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
