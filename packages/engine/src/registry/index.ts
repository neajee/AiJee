import type { EngineAdapter, EngineId } from "../core/engine.ts";
import type { CreateSessionInput } from "../core/types.ts";
import type { EngineSession } from "../core/session.ts";

export class EngineRegistry {
  private readonly adapters = new Map<EngineId, EngineAdapter>();

  register(adapter: EngineAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  list(): EngineAdapter[] {
    return [...this.adapters.values()];
  }

  async resolve(preferred?: EngineId): Promise<EngineAdapter | undefined> {
    if (preferred) {
      const adapter = this.adapters.get(preferred);
      return adapter && await adapter.probe() ? adapter : undefined;
    }
    for (const adapter of this.adapters.values()) if (await adapter.probe()) return adapter;
    return undefined;
  }

  async createSession(input: CreateSessionInput, preferred?: EngineId): Promise<EngineSession> {
    const adapter = await this.resolve(preferred);
    if (!adapter) throw new Error(preferred ? `Engine unavailable: ${preferred}` : "No engine is available");
    return adapter.createSession(input);
  }
}

export type { EngineAdapter, EngineId };
