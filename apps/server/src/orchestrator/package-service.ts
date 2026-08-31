import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { homedir } from "node:os";
import { DefaultPackageManager, SettingsManager, getAgentDir } from "@earendil-works/pi-coding-agent";

const exec = promisify(execFile);
type Log = { id: number; operation: string; status: string; output: string; created_at: string };

export class PackageService {
  private readonly operationLogs: Log[] = [];
  private nextId = 1;
  private operationLock?: Promise<unknown>;
  private cancelRequested = false;
  private readonly onProgress?: (event: Record<string, unknown>) => void;
  constructor(onProgress?: (event: Record<string, unknown>) => void) { this.onProgress = onProgress; }

  status(): Record<string, unknown> { return { name: "aijee", installed: true, installed_version: "0.1.0", latest_version: null }; }
  logs(limit = 50): Log[] { return this.operationLogs.slice(-Math.max(1, Math.min(limit, 200))); }

  async installed(cwd = homedir()): Promise<Record<string, unknown>> {
    const manager = this.manager(cwd);
    const packages = manager.listConfiguredPackages().map((item) => ({ name: item.source, scope: item.scope, installed: Boolean(item.installedPath), path: item.installedPath ?? null }));
    return { packages, output: packages.length ? packages.map((item) => `${item.name} [${item.scope}]${item.installed ? "" : " (未解析)"}`).join("\n") : "暂无已安装插件" };
  }

  async marketplace(query = "", category = "", limit = 30): Promise<Record<string, unknown>> {
    const url = new URL("https://pi.dev/packages");
    if (query) url.searchParams.set("name", query);
    if (category && category !== "all") url.searchParams.set("type", category.toLowerCase());
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { accept: "text/html" } });
    if (!response.ok) throw new Error(`Package catalog unavailable (${response.status})`);
    const html = await response.text();
    const packages = [...html.matchAll(/(<article[^>]*data-package-card="true"[^>]*>)([\s\S]*?)<\/article>/g)].slice(0, Math.min(Math.max(limit, 1), 100)).map(([, tag, body]) => {
      const attr = (name: string) => body?.match(new RegExp(`${name}="([^"]*)"`))?.[1];
      const tagAttr = (name: string) => tag?.match(new RegExp(`${name}="([^"]*)"`))?.[1];
      const name = tagAttr("data-package-name") ?? body?.match(/packages-name[^>]*>\s*<a[^>]*>([^<]+)/)?.[1] ?? "";
      const version = attr("data-package-version") ?? "";
      const description = body?.match(/packages-desc[^>]*>([\s\S]*?)<\//)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? null;
      return { name, version, description, author: attr("data-package-author") ?? null, npm_url: `https://www.npmjs.com/package/${name}`, package_types: (attr("data-package-types") ?? "Extension").split(/\s+/), repository: attr("data-package-repository") ?? null };
    }).filter((p) => p.name);
    return { packages, total: packages.length, from_cache: false };
  }

  async operationRequest(request: { operation: string; name: string; scope?: string; version?: string | null; cwd?: string }): Promise<Record<string, unknown>> {
    const operation = request.operation;
    if (!["install", "remove", "update"].includes(operation)) throw new Error("Unsupported package operation");
    const base = request.name.startsWith("npm:") || request.name.startsWith("git:") ? request.name : `npm:${request.name}`;
    if (!/^(npm|git):[^\s]+$/.test(base) || (request.scope && !["user", "project"].includes(request.scope))) throw new Error("Invalid package source or scope");
    const source = request.version && operation === "install" ? `${base}@${request.version}` : base;
    const manager = this.manager(request.cwd ?? homedir());
    this.cancelRequested = false;
    manager.setProgressCallback((event) => { if (this.cancelRequested) throw new Error("Package operation cancelled"); this.onProgress?.({ ...event, name: request.name }); });
    const started = new Date().toISOString();
    if (this.operationLock) await this.operationLock;
    let release!: () => void;
    this.operationLock = new Promise<void>((resolve) => { release = resolve; });
    try {
      const local = request.scope === "project";
      if (operation === "install") await manager.installAndPersist(source, { local });
      else if (operation === "remove") await manager.removeAndPersist(source, { local });
      else await manager.update(source === "*" ? undefined : source);
      const output = `${operation} ${source} completed`;
      this.operationLogs.push({ id: this.nextId++, operation, status: "success", output, created_at: started });
      return { operation, output, success: true };
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error);
      this.operationLogs.push({ id: this.nextId++, operation, status: "failed", output, created_at: started });
      return { operation, output, success: false };
    } finally {
      release();
      this.operationLock = undefined;
    }
  }

  cancel(): boolean { if (!this.operationLock) return false; this.cancelRequested = true; return true; }

  private manager(cwd: string): DefaultPackageManager {
    return new DefaultPackageManager({ cwd, agentDir: getAgentDir(), settingsManager: SettingsManager.create(cwd, getAgentDir()) });
  }

  async operation(operation: "install" | "update"): Promise<Record<string, unknown>> {
    const started = new Date().toISOString();
    try {
      const result = await exec("npm", ["--version"], { maxBuffer: 1024 * 1024 });
      const output = `npm ${result.stdout.trim()} available; ${operation} is managed by the installed AiJee package`;
      this.operationLogs.push({ id: this.nextId++, operation, status: "success", output, created_at: started });
      return { operation, output, success: true };
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error);
      this.operationLogs.push({ id: this.nextId++, operation, status: "failed", output, created_at: started });
      return { operation, output, success: false };
    }
  }
}
