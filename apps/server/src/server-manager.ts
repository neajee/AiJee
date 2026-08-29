import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";

export const DEFAULT_SERVER_URL = "http://127.0.0.1:5454";

export function isHealthPayload(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const payload = value as { ok?: unknown; status?: unknown };
  return payload.ok === true || payload.status === "ok";
}

export function localServerArgs(serverUrl: string): string[] | undefined {
  const url = new URL(serverUrl);
  const localHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
  if (!localHosts.has(url.hostname)) return undefined;

  const args = ["--experimental-strip-types", fileURLToPath(new URL("./main.ts", import.meta.url)), "serve", "--host", url.hostname];
  if (url.port) args.push("--port", url.port);
  return args;
}

export class ServerManager {
  readonly url: string;
  readonly command: string;
  private child?: ChildProcess;
  private starting?: Promise<boolean>;

  constructor() {
    this.url = process.env.PIDECK_SERVER_URL ?? DEFAULT_SERVER_URL;
    this.command = process.execPath;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.url}/api/health`, {
        signal: AbortSignal.timeout(1200),
      });
      if (!response.ok) return false;
      return isHealthPayload(await response.json());
    } catch {
      return false;
    }
  }

  async ensureStarted(): Promise<boolean> {
    if (await this.isHealthy()) return true;
    if (this.starting) return this.starting;

    this.starting = this.start().finally(() => {
      this.starting = undefined;
    });
    return this.starting;
  }

  stop(): boolean {
    if (!this.child || this.child.killed) return false;
    const stopped = this.child.kill("SIGTERM");
    if (stopped) this.child = undefined;
    return stopped;
  }

  private async start(): Promise<boolean> {
    const args = localServerArgs(this.url);
    if (!args) return false;

    const child = spawn(this.command, args, {
      detached: true,
      stdio: "ignore",
    });
    this.child = child;
    child.unref();

    const spawnFailed = new Promise<boolean>((resolve) => {
      child.once("error", () => resolve(false));
    });
    return Promise.race([this.waitForHealth(), spawnFailed]);
  }

  private async waitForHealth(timeoutMs = 10_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.isHealthy()) return true;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return false;
  }
}
