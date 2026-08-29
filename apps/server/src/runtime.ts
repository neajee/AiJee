import { SessionRegistry } from "./sessions/registry.ts";
import type { CreateSessionInput, SessionDescriptor } from "@pideck/engine";

/** Product-level Pi SDK runtime. HTTP/desktop launchers use this singleton. */
export class PiDeckRuntime {
  readonly sessions: SessionRegistry;

  constructor(sessions: SessionRegistry = new SessionRegistry()) {
    this.sessions = sessions;
  }

  createSession(key: string, input: CreateSessionInput, engine?: "pi" | "codex" | "opencode"): Promise<SessionDescriptor> {
    return this.sessions.create(key, input, engine);
  }

  async stop(): Promise<void> {
    await this.sessions.dispose();
  }
}
