import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

type TaskDefinition = { label: string; command: string; cwd?: string | null; env?: Record<string, string> | null; source?: string };
type TaskInfo = { id: string; label: string; command: string; source: string; status: "running" | "stopped" | "failed"; started_at: string; stopped_at?: string | null; exit_code?: number | null; workspace_id: string; cwd: string };
type StoredTask = { info: TaskInfo; lines: string[]; definition: TaskDefinition };

export class TaskService {
  private readonly tasks = new Map<string, StoredTask & { process?: ChildProcess }>();
  private readonly statePath: string;

  constructor(statePath: string) { this.statePath = statePath; }

  async load(): Promise<void> {
    try {
      const saved = JSON.parse(await readFile(this.statePath, "utf8")) as StoredTask[];
      for (const task of saved) {
        if (!task?.info?.id) continue;
        if (task.info.status === "running") task.info = { ...task.info, status: "stopped", stopped_at: new Date().toISOString(), exit_code: null };
        this.tasks.set(task.info.id, { ...task, lines: task.lines.slice(-2000) });
      }
      await this.persist();
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }

  async definitions(cwd: string): Promise<TaskDefinition[]> {
    try {
      const value = JSON.parse(await readFile(join(cwd, ".pi/tasks.json"), "utf8")) as { tasks?: TaskDefinition[] };
      return Array.isArray(value.tasks) ? value.tasks : [];
    } catch { return []; }
  }

  async start(workspaceId: string, workspaceCwd: string, label: string): Promise<TaskInfo> {
    const definition = (await this.definitions(workspaceCwd)).find((item) => item.label === label);
    if (!definition) throw new Error(`Task not found: ${label}`);
    const root = resolve(workspaceCwd);
    const cwd = definition.cwd ? resolve(root, definition.cwd) : root;
    if (cwd !== root && !cwd.startsWith(`${root}/`)) throw new Error("Task cwd is outside its workspace");
    const info: TaskInfo = { id: randomUUID(), label: definition.label, command: definition.command, source: definition.source ?? "pi", status: "running", started_at: new Date().toISOString(), workspace_id: workspaceId, cwd, exit_code: null, stopped_at: null };
    const entry: StoredTask & { process?: ChildProcess } = { info, lines: [], definition };
    this.tasks.set(info.id, entry);
    this.spawn(entry);
    await this.persist();
    return info;
  }

  list(workspaceId: string): TaskInfo[] { return [...this.tasks.values()].filter((task) => task.info.workspace_id === workspaceId).map((task) => task.info); }
  logs(id: string): { id: string; label: string; lines: string[]; total_lines: number } { const task = this.tasks.get(id); if (!task) throw new Error("Task not found"); return { id, label: task.info.label, lines: task.lines, total_lines: task.lines.length }; }
  async stop(id: string): Promise<TaskInfo> { const task = this.require(id); task.process?.kill("SIGTERM"); if (!task.process) task.info = { ...task.info, status: "stopped", stopped_at: new Date().toISOString() }; await this.persist(); return task.info; }
  async remove(id: string): Promise<void> { const task = this.require(id); task.process?.kill("SIGTERM"); this.tasks.delete(id); await this.persist(); }
  async restart(id: string): Promise<TaskInfo> { const task = this.require(id); task.process?.kill("SIGTERM"); task.info = { ...task.info, status: "running", started_at: new Date().toISOString(), stopped_at: null, exit_code: null }; task.lines = []; this.spawn(task); await this.persist(); return task.info; }

  private require(id: string): StoredTask & { process?: ChildProcess } { const task = this.tasks.get(id); if (!task) throw new Error("Task not found"); return task; }
  private spawn(entry: StoredTask & { process?: ChildProcess }): void {
    const child = spawn(entry.info.command, { cwd: entry.info.cwd, env: { ...process.env, ...entry.definition.env }, shell: true, stdio: ["ignore", "pipe", "pipe"] });
    entry.process = child;
    const append = (chunk: Buffer) => { entry.lines.push(...chunk.toString().split("\n").filter(Boolean)); if (entry.lines.length > 2000) entry.lines.splice(0, entry.lines.length - 2000); void this.persist(); };
    child.stdout?.on("data", append); child.stderr?.on("data", append);
    child.once("exit", (code) => { entry.info = { ...entry.info, exit_code: code, status: code === 0 ? "stopped" : "failed", stopped_at: new Date().toISOString() }; entry.process = undefined; void this.persist(); });
  }
  private async persist(): Promise<void> { await mkdir(dirname(this.statePath), { recursive: true }); const tmp = `${this.statePath}.tmp`; await writeFile(tmp, JSON.stringify([...this.tasks.values()].map(({ process: _process, ...task }) => task)), { mode: 0o600 }); await rename(tmp, this.statePath); }
}
