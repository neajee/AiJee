import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type RuntimeIdentity = {
  username: string;
  password_hash: string;
  signing_secret: string;
};

export type PersistedSession = {
  session_id: string;
  session_file: string;
  workspace_id: string;
  cwd: string;
  created_at: string;
  last_active: number;
  mode_id?: string;
};

export type RuntimeState = { workspaces: unknown[]; identity?: RuntimeIdentity; /** Legacy read-only migration marker. */ local_workspace_seeded?: boolean; local_signing_secret?: string; runtime_secret?: string; devices?: unknown[]; device_codes?: unknown[]; custom_models?: Record<string, unknown>; modes?: unknown[]; sessions?: PersistedSession[]; archived_session_ids?: string[] };

export class RuntimeStateStore {
  private readonly path: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(path: string) {
    this.path = path;
  }

  async load(): Promise<RuntimeState> {
    try {
      const parsed = JSON.parse(await readFile(this.path, "utf8")) as Partial<RuntimeState>;
      return { workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces : [], identity: parsed.identity, local_workspace_seeded: parsed.local_workspace_seeded, local_signing_secret: parsed.local_signing_secret, runtime_secret: parsed.runtime_secret, devices: Array.isArray(parsed.devices) ? parsed.devices : [], device_codes: Array.isArray(parsed.device_codes) ? parsed.device_codes : [], custom_models: parsed.custom_models, modes: Array.isArray(parsed.modes) ? parsed.modes : [], sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [], archived_session_ids: Array.isArray(parsed.archived_session_ids) ? parsed.archived_session_ids : [] };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { workspaces: [] };
      throw error;
    }
  }

  async save(state: RuntimeState): Promise<void> {
    const operation = async () => {
      await mkdir(dirname(this.path), { recursive: true });
      const temporary = `${this.path}.tmp`;
      await writeFile(temporary, JSON.stringify(state), { mode: 0o600 });
      await rename(temporary, this.path);
    };
    this.writeQueue = this.writeQueue.then(operation);
    await this.writeQueue;
  }

  async update(patch: Partial<RuntimeState>): Promise<void> {
    const operation = async () => {
      const current = await this.load();
      await mkdir(dirname(this.path), { recursive: true });
      const temporary = `${this.path}.tmp`;
      await writeFile(temporary, JSON.stringify({ ...current, ...patch }), { mode: 0o600 });
      await rename(temporary, this.path);
    };
    this.writeQueue = this.writeQueue.then(operation);
    await this.writeQueue;
  }
}
