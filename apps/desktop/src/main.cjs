const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("node:child_process");
const { request } = require("node:http");
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const WebSocket = require("ws");

let server;
let chrome;
let broker;
const port = Number(process.env.AIJEE_PORT || 5454);
const url = process.env.AIJEE_CLIENT_URL || `http://127.0.0.1:${port}`;
const brokerPort = Number(process.env.AIJEE_CDP_PORT || 5455);

function chromePath() {
  if (process.env.AIJEE_CHROME_PATH) return process.env.AIJEE_CHROME_PATH;
  const candidates = process.platform === "win32"
    ? [
        join(process.env.PROGRAMFILES || "C:\\Program Files", "Google\\Chrome\\Application\\chrome.exe"),
        join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google\\Chrome\\Application\\chrome.exe"),
        join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
        join(process.env.PROGRAMFILES || "C:\\Program Files", "Microsoft\\Edge\\Application\\msedge.exe"),
      ]
    : process.platform === "darwin"
      ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]
      : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  return candidates.find((candidate) => existsSync(candidate)) || null;
}

function jsonRequest(path) {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: "127.0.0.1", port: 9222, path }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve(JSON.parse(body)));
    });
    req.once("error", reject);
    req.end();
  });
}

function startPreviewBroker() {
  const executable = chromePath();
  if (!executable) {
    console.error("No Chrome or Edge executable found; browser preview is unavailable");
    return;
  }
  chrome = spawn(executable, [
    "--headless=new", "--remote-debugging-port=9222", "--disable-gpu",
    "--no-first-run", "--no-default-browser-check", `--user-data-dir=${join(app.getPath("userData"), "preview-browser")}`,
    "about:blank",
  ], { stdio: "ignore" });
  chrome.once("error", (error) => console.error(`Unable to start preview browser: ${error.message}`));
  broker = new WebSocket.Server({ host: "127.0.0.1", port: brokerPort });
  broker.on("connection", async (socket) => {
    let cdp;
    try {
      let targets;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        try { targets = await jsonRequest("/json"); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
      }
      const page = targets?.find((target) => target.type === "page");
      if (!page?.webSocketDebuggerUrl) throw new Error("Chrome page target unavailable");
      cdp = new WebSocket(page.webSocketDebuggerUrl);
      let nextId = 0;
      const pending = new Map();
      const call = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve, reject });
        cdp.send(JSON.stringify({ id, method, params }));
      });
      cdp.on("message", (raw) => {
        const message = JSON.parse(raw.toString());
        if (message.id && pending.has(message.id)) {
          const task = pending.get(message.id); pending.delete(message.id);
          return message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
        }
        if (message.method === "Page.screencastFrame") {
          socket.send(JSON.stringify({ type: "frame", data: `data:image/jpeg;base64,${message.params.data}`, width: message.params.metadata.deviceWidth, height: message.params.metadata.deviceHeight }));
          void call("Page.screencastFrameAck", { sessionId: message.params.sessionId });
        }
      });
      await new Promise((resolve, reject) => { cdp.once("open", resolve); cdp.once("error", reject); });
      socket.on("message", async (raw) => {
        const message = JSON.parse(raw.toString());
        if (message.type === "init") {
          const targetUrl = String(message.url);
          if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(targetUrl)) throw new Error("Preview URL must be local");
          if (message.token) await call("Network.setCookie", { name: "aijee_token", value: String(message.token), url: targetUrl, path: "/" });
          await call("Network.enable"); await call("Page.enable");
          await call("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
          await call("Page.startScreencast", { format: "jpeg", quality: 75, everyNthFrame: 1 });
          await call("Page.navigate", { url: targetUrl });
        } else if (message.type === "click") {
          await call("Input.dispatchMouseEvent", { type: "mousePressed", x: message.x, y: message.y, button: "left", clickCount: 1 });
          await call("Input.dispatchMouseEvent", { type: "mouseReleased", x: message.x, y: message.y, button: "left", clickCount: 1 });
        } else if (message.type === "key") {
          await call("Input.dispatchKeyEvent", message.event);
        }
      });
    } catch (error) { socket.send(JSON.stringify({ type: "error", message: error.message })); socket.close(); }
    socket.once("close", () => cdp?.close());
  });
}

function waitForRuntime() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000;
    const check = async () => {
      try {
        const response = await fetch(`${url}/api/health`);
        if (response.ok) return resolve();
      } catch {}
      if (Date.now() >= deadline) return reject(new Error(`Runtime did not start at ${url}`));
      setTimeout(check, 150);
    };
    check();
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.webContents.setUserAgent(`${window.webContents.getUserAgent()} AiJeeDesktop/0.1.0`);
  window.loadURL(url);
  window.webContents.on("did-fail-load", (_event, code, description) => {
    if (code !== -3) dialog.showErrorBox("AiJee failed to load", description);
  });
  return window;
}

app.whenReady().then(async () => {
  startPreviewBroker();
  if (!process.env.AIJEE_CLIENT_URL) {
    const runtime = require.resolve("aijee/bin/aijee.cjs");
    server = spawn(process.execPath, [runtime, "serve", "--host", "127.0.0.1", "--port", String(port)], {
      stdio: "inherit",
      env: { ...process.env, AIJEE_WEB_ROOT: process.env.AIJEE_WEB_ROOT },
    });
  }
  server?.once("error", (error) => {
    console.error(`Unable to start AiJee server: ${error.message}`);
  });
  try {
    await waitForRuntime();
    createWindow();
  } catch (error) {
    dialog.showErrorBox("AiJee startup failed", error.message);
    app.quit();
  }
});

app.on("before-quit", () => {
  if (server && !server.killed) server.kill("SIGTERM");
  if (chrome && !chrome.killed) chrome.kill("SIGTERM");
  broker?.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
