import {
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  getAgentDir,
  SessionManager,
  type AgentSessionRuntime,
  type CreateAgentSessionRuntimeFactory,
} from "@earendil-works/pi-coding-agent";
import type { EngineAdapter } from "../../core/engine.ts";
import type { CreateSessionInput } from "../../core/types.ts";
import { PiSession } from "./pi-session.ts";
import { piCapabilities } from "./capabilities.ts";

async function createPiRuntime({ cwd, sessionFile, appendSystemPrompt }: CreateSessionInput): Promise<AgentSessionRuntime> {
  const createRuntime: CreateAgentSessionRuntimeFactory = async ({ cwd: effectiveCwd, sessionManager, sessionStartEvent }) => {
    const services = await createAgentSessionServices({
      cwd: effectiveCwd,
      resourceLoaderOptions: appendSystemPrompt?.length ? { appendSystemPrompt } : undefined,
    });
    return {
      ...(await createAgentSessionFromServices({ services, sessionManager, sessionStartEvent })),
      services,
      diagnostics: services.diagnostics,
    };
  };
  return createAgentSessionRuntime(createRuntime, {
    cwd,
    agentDir: getAgentDir(),
    sessionManager: sessionFile ? SessionManager.open(sessionFile, undefined, cwd) : SessionManager.create(cwd),
  });
}

export function createPiEngineAdapter(): EngineAdapter {
  return {
    id: "pi",
    capabilities: piCapabilities,
    probe: () => true,
    describe: () => ({ id: "pi", version: "0.84.4", embedded: true }),
    async createSession(input) {
      return new PiSession(await createPiRuntime(input), input.cwd);
    },
  };
}
