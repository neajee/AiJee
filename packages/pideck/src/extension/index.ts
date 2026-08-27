import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { ServerManager } from "../runtime/server-manager.ts";

const server = new ServerManager();

export default function pideck(pi: ExtensionAPI) {
  pi.registerCommand("pideck", {
    description: "Start or connect to PiDeck",
    handler: async (_args, ctx) => {
      const healthy = await server.ensureStarted();
      ctx.ui.notify(
        healthy
          ? `PiDeck is ready at ${server.url}`
          : `PiDeck failed to start with ${server.command}`,
        healthy ? "info" : "error",
      );
    },
  });

  pi.registerCommand("pideck-status", {
    description: "Check PiDeck status",
    handler: async (_args, ctx) => {
      const healthy = await server.isHealthy();
      ctx.ui.notify(healthy ? `PiDeck is running at ${server.url}` : "PiDeck is not running", "info");
    },
  });

  pi.registerCommand("pideck-stop", {
    description: "Stop PiDeck started by this Pi session",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        server.stop() ? "PiDeck stopped" : "This Pi session does not own PiDeck",
        "info",
      );
    },
  });
}
