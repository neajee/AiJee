import { PiDeckHttpServer } from "../api/http-server.ts";

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

export async function runCli(args: string[]): Promise<void> {
  if (args.includes("--version") || args.includes("-V")) {
    process.stdout.write("pideck 0.1.0\n");
    return;
  }
  const command = args[0]?.startsWith("-") ? undefined : args[0];
  if (command === "auth" && args[1] === "reset") {
    await new PiDeckHttpServer(undefined, process.env.PIDECK_STATE_PATH).resetAuth();
    process.stdout.write("PiDeck authentication reset; run `pideck serve` to set it up again.\n");
    return;
  }
  if (command && !["serve", "desktop"].includes(command)) throw new Error(`Unknown command: ${command}`);
  const port = Number(valueAfter(args, "--port") ?? process.env.PIDECK_PORT ?? 5454);
  const host = valueAfter(args, "--host") ?? process.env.PIDECK_HOST ?? "127.0.0.1";
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port must be between 1 and 65535");

  const server = new PiDeckHttpServer(undefined, process.env.PIDECK_STATE_PATH);
  await server.listen(port, host);
  process.stdout.write(`PiDeck Runtime listening at ${server.url()}\n`);
  const origin = `${host === "0.0.0.0" ? "http://127.0.0.1" : `http://${host}`}:${port}`;
  process.stdout.write(`Open: ${await server.bootstrapLink(origin)}\n`);
  if (host === "0.0.0.0") process.stdout.write("Other devices can use this link or scan its QR code.\n");
  const shutdown = () => void server.close().finally(() => process.exit(0));
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
