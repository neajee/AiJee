const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const { createServer } = require("node:net");
const { join } = require("node:path");

let server;
let mainWindow;
let url = process.env.AIJEE_CLIENT_URL || "";
const preferredPort = Number(process.env.AIJEE_PORT || 10088);

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
  return candidates.find((candidate) => existsSync(candidate)) || "";
}

function findAvailablePort(start) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", (error) => {
      if (error.code === "EADDRINUSE" && start < preferredPort + 100) resolve(findAvailablePort(start + 1));
      else reject(error);
    });
    probe.listen(start, "127.0.0.1", () => probe.close(() => resolve(start)));
  });
}

function waitForRuntime() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000;
    const check = async () => {
      try { if ((await fetch(`${url}/api/health`)).ok) return resolve(); } catch {}
      if (Date.now() >= deadline) return reject(new Error(`Runtime did not start at ${url}`));
      setTimeout(check, 150);
    };
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1440, height: 960, webPreferences: { contextIsolation: true, sandbox: true } });
  mainWindow.webContents.setUserAgent(`${mainWindow.webContents.getUserAgent()} AiJeeDesktop/${app.getVersion()}`);
  mainWindow.loadURL(url);
  mainWindow.once("closed", () => { mainWindow = undefined; });
  mainWindow.webContents.on("did-fail-load", (_event, code, description) => {
    if (code !== -3) dialog.showErrorBox("AiJee failed to load", description);
  });
}

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) app.quit();
else {
  app.on("second-instance", () => {
    if (mainWindow?.isMinimized()) mainWindow.restore();
    mainWindow?.show();
    mainWindow?.focus();
  });
  app.whenReady().then(async () => {
    if (!url) {
      const port = await findAvailablePort(preferredPort);
      url = `http://127.0.0.1:${port}`;
      const runtime = require.resolve("aijee/bin/aijee.cjs");
      server = spawn(process.execPath, [runtime, "serve", "--host", "127.0.0.1", "--port", String(port)], {
        stdio: "inherit",
        env: { ...process.env, AIJEE_CHROME_PATH: chromePath() },
      });
      server.once("error", (error) => console.error(`Unable to start AiJee server: ${error.message}`));
    }
    try { await waitForRuntime(); createWindow(); }
    catch (error) { dialog.showErrorBox("AiJee startup failed", error.message); app.quit(); }
  });
}

app.on("activate", () => { if (!mainWindow) createWindow(); });
app.on("before-quit", () => { if (server && !server.killed) server.kill("SIGTERM"); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
