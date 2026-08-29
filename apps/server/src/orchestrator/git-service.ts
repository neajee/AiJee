import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function git(cwd: string, args: string[]): Promise<string> {
  const result = await exec("git", ["-C", cwd, ...args], { maxBuffer: 4 * 1024 * 1024 });
  return result.stdout;
}

export async function gitStatus(cwd: string): Promise<Record<string, unknown>> {
  const lines = (await git(cwd, ["status", "--porcelain=v1", "--branch"])).split("\n").filter(Boolean);
  const branchLine = lines.shift() ?? "## HEAD";
  const branch = branchLine.slice(3).split("...")[0].split(" ")[0] || "HEAD";
  const staged: Array<{ path: string; status: string }> = [];
  const unstaged: Array<{ path: string; status: string }> = [];
  const untracked: string[] = [];
  for (const line of lines) {
    const status = line.slice(0, 2);
    const path = line.slice(3);
    if (status === "??") untracked.push(path);
    else { if (status[0] !== " ") staged.push({ path, status: status[0] }); if (status[1] !== " ") unstaged.push({ path, status: status[1] }); }
  }
  return { branch, ahead: 0, behind: 0, is_clean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0, staged, unstaged, untracked };
}
