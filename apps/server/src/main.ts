export { runCli } from "./cli/commands.ts";

if (process.argv[1]?.endsWith("/main.ts")) {
  const { runCli } = await import("./cli/commands.ts");
  void runCli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`Unable to start PiDeck: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
