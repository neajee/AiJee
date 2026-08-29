import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void };
type CdpSession = { socket: WebSocket; call: (method: string, params?: Record<string, unknown>) => Promise<unknown> };

function browserPath(): string | undefined {
  if (process.env.AIJEE_CHROME_PATH && existsSync(process.env.AIJEE_CHROME_PATH)) return process.env.AIJEE_CHROME_PATH;
  const candidates = process.platform === "win32"
    ? [
        join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Google\\Chrome\\Application\\chrome.exe"),
        join(process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)", "Google\\Chrome\\Application\\chrome.exe"),
        join(process.env.LOCALAPPDATA ?? "", "Google\\Chrome\\Application\\chrome.exe"),
        join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Microsoft\\Edge\\Application\\msedge.exe"),
      ]
    : process.platform === "darwin"
      ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]
      : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  return candidates.find((candidate) => existsSync(candidate));
}

async function requestJson(port: number, path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: "127.0.0.1", port, path }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    req.once("error", reject);
    req.end();
  });
}

export class PreviewBroker {
  private browser?: ChildProcess;
  private debugPort?: Promise<number>;
  private readonly sessions = new Set<CdpSession>();
  private readonly profile = join(tmpdir(), `aijee-preview-${process.pid}`);

  attach(client: WebSocket): void {
    void this.connect(client).catch((error) => {
      if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ type: "error", message: error instanceof Error ? error.message : String(error) }));
      client.close();
    });
  }

  async close(): Promise<void> {
    for (const session of this.sessions) session.socket.close();
    this.sessions.clear();
    if (this.browser && !this.browser.killed) {
      const exited = new Promise<void>((resolve) => this.browser?.once("exit", () => resolve()));
      this.browser.kill("SIGTERM");
      await Promise.race([exited, new Promise<void>((resolve) => setTimeout(resolve, 2000))]);
    }
    await rm(this.profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }

  private async startBrowser(): Promise<number> {
    const executable = browserPath();
    if (!executable) throw new Error("Chrome or Edge is required for browser preview");
    await rm(this.profile, { recursive: true, force: true });
    this.browser = spawn(executable, [
      "--headless=new", "--remote-debugging-port=0", "--disable-gpu",
      "--no-first-run", "--no-default-browser-check", `--user-data-dir=${this.profile}`, "about:blank",
    ], { stdio: "ignore" });
    this.browser.once("error", () => { this.debugPort = undefined; });
    const deadline = Date.now() + 10000;
    const file = join(this.profile, "DevToolsActivePort");
    while (Date.now() < deadline) {
      try {
        const port = Number((await readFile(file, "utf8")).split(/\r?\n/, 1)[0]);
        if (Number.isInteger(port) && port > 0) return port;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("Preview browser did not expose a debugging endpoint");
  }

  private async connect(client: WebSocket): Promise<void> {
    const queued: string[] = [];
    let receive: ((raw: string) => void) | undefined;
    client.on("message", (raw) => {
      const value = raw.toString();
      if (receive) receive(value);
      else queued.push(value);
    });
    this.debugPort ??= this.startBrowser();
    const targets = await requestJson(await this.debugPort, "/json") as Array<Record<string, unknown>>;
    const target = targets.find((item) => item.type === "page");
    if (typeof target?.webSocketDebuggerUrl !== "string") throw new Error("Chrome page target unavailable");
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    let nextId = 0;
    const pending = new Map<number, Pending>();
    const call = (method: string, params: Record<string, unknown> = {}) => new Promise<unknown>((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const session = { socket, call };
    this.sessions.add(session);
    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString());
      const task = message.id ? pending.get(message.id) : undefined;
      if (task) {
        pending.delete(message.id);
        return message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
      }
      if (message.method === "Page.screencastFrame" && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "frame", data: `data:image/jpeg;base64,${message.params.data}`, width: message.params.metadata.deviceWidth, height: message.params.metadata.deviceHeight }));
        void call("Page.screencastFrameAck", { sessionId: message.params.sessionId });
      }
    });
    await new Promise<void>((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
    receive = (raw) => void this.handleMessage(call, raw).catch((error) => {
      if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ type: "error", message: error.message }));
    });
    for (const raw of queued) receive(raw);
    client.once("close", () => { socket.close(); this.sessions.delete(session); });
  }

  private async handleMessage(call: CdpSession["call"], raw: string): Promise<void> {
    const message = JSON.parse(raw);
    if (message.type === "init") {
      const targetUrl = String(message.url);
      if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(targetUrl)) throw new Error("Preview URL must be local");
      await call("Network.enable");
      if (message.token) await call("Network.setCookie", { name: "aijee_token", value: String(message.token), url: targetUrl, path: "/" });
      await call("Page.enable");
      await call("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      await call("Page.startScreencast", { format: "jpeg", quality: 75, everyNthFrame: 1 });
      await call("Page.navigate", { url: targetUrl });
    } else if (message.type === "click") {
      await call("Input.dispatchMouseEvent", { type: "mousePressed", x: message.x, y: message.y, button: "left", clickCount: 1 });
      await call("Input.dispatchMouseEvent", { type: "mouseReleased", x: message.x, y: message.y, button: "left", clickCount: 1 });
    } else if (message.type === "key") await call("Input.dispatchKeyEvent", message.event);
  }
}
