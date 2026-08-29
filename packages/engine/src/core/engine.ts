import type { EngineCapabilities } from "./capabilities.ts";
import type { CreateSessionInput, JsonValue } from "./types.ts";
import type { EngineSession } from "./session.ts";

export type EngineId = "pi" | "codex" | "opencode";

export interface EngineAdapter {
  readonly id: EngineId;
  readonly capabilities: EngineCapabilities;
  probe(): boolean | Promise<boolean>;
  createSession(input: CreateSessionInput): Promise<EngineSession>;
  describe(): JsonValue;
}
