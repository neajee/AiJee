import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { ServerManager } from "../server-manager.ts";

const server = new ServerManager();

export default function aijee(pi: ExtensionAPI) {
  pi.registerCommand("aijee", {
    description: "Start or connect to AiJee",
    handler: async (_args, ctx) => {
      const healthy = await server.ensureStarted();
      ctx.ui.notify(
        healthy
          ? `AiJee is ready at ${server.url}`
          : `AiJee failed to start with ${server.command}`,
        healthy ? "info" : "error",
      );
    },
  });

  pi.registerCommand("aijee-status", {
    description: "Check AiJee status",
    handler: async (_args, ctx) => {
      const healthy = await server.isHealthy();
      ctx.ui.notify(healthy ? `AiJee is running at ${server.url}` : "AiJee is not running", "info");
    },
  });

  pi.registerCommand("aijee-stop", {
    description: "Stop AiJee started by this Pi session",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        server.stop() ? "AiJee stopped" : "This Pi session does not own AiJee",
        "info",
      );
    },
  });
}
