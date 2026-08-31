import { createPiEngineAdapter } from "@aijee/engine";
import { EngineRegistry } from "@aijee/engine";
import type { CreateSessionInput, EngineAdapter, EngineSession, SessionDescriptor } from "@aijee/engine";

type SessionFactory = (input: CreateSessionInput) => Promise<EngineSession>;

/** Owns engine-neutral session lifetime, deduplication and disposal. */
export class SessionRegistry {
  private readonly sessions = new Map<string, EngineSession>();
  private readonly creating = new Map<string, Promise<EngineSession>>();
  private readonly engines: EngineRegistry;

  constructor(factory?: SessionFactory, engines = new EngineRegistry()) {
    this.engines = engines;
    if (factory) this.engines.register({ id: "pi", capabilities: createPiEngineAdapter().capabilities, probe: () => true, describe: () => ({ id: "pi" }), createSession: factory });
    else this.engines.register(createPiEngineAdapter());
  }

  registerEngine(adapter: EngineAdapter): void { this.engines.register(adapter); }

  async create(key: string, input: CreateSessionInput, engine?: "pi" | "codex" | "opencode"): Promise<SessionDescriptor> {
    return (await this.getOrCreate(key, input, engine)).describe();
  }

  get(key: string): EngineSession | undefined { return this.sessions.get(key); }
  list(): SessionDescriptor[] { return [...this.sessions.values()].map((session) => session.describe()); }
  enginesList() { return this.engines.list().map((engine) => engine.describe()); }
  async reloadResources(): Promise<void> {
    await Promise.all([...this.sessions.values()].map((session) => session.reloadResources?.()));
  }

  async remove(key: string): Promise<boolean> {
    const session = this.sessions.get(key);
    if (!session) return false;
    this.sessions.delete(key);
    await session.dispose();
    return true;
  }

  async dispose(): Promise<void> { await Promise.all([...this.sessions.keys()].map((key) => this.remove(key))); }

  private async getOrCreate(key: string, input: CreateSessionInput, preferred?: "pi" | "codex" | "opencode"): Promise<EngineSession> {
    const existing = this.sessions.get(key);
    if (existing) return existing;
    const pending = this.creating.get(key);
    if (pending) return pending;
    const creation = this.engines.createSession(input, preferred)
      .then((session) => { this.sessions.set(key, session); return session; })
      .finally(() => this.creating.delete(key));
    this.creating.set(key, creation);
    return creation;
  }
}
