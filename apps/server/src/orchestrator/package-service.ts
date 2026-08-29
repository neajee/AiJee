import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
type Log = { id: number; operation: string; status: string; output: string; created_at: string };

export class PackageService {
  private readonly operationLogs: Log[] = [];
  private nextId = 1;

  status(): Record<string, unknown> { return { name: "pideck", installed: true, installed_version: "0.1.0", latest_version: null }; }
  logs(limit = 50): Log[] { return this.operationLogs.slice(-Math.max(1, Math.min(limit, 200))); }

  async operation(operation: "install" | "update"): Promise<Record<string, unknown>> {
    const started = new Date().toISOString();
    try {
      const result = await exec("npm", ["--version"], { maxBuffer: 1024 * 1024 });
      const output = `npm ${result.stdout.trim()} available; ${operation} is managed by the installed PiDeck package`;
      this.operationLogs.push({ id: this.nextId++, operation, status: "success", output, created_at: started });
      return { operation, output, success: true };
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error);
      this.operationLogs.push({ id: this.nextId++, operation, status: "failed", output, created_at: started });
      return { operation, output, success: false };
    }
  }
}
