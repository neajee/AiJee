const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");

let server;

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
  window.loadURL(process.env.AIJEE_CLIENT_URL || "http://127.0.0.1:5454");
}

app.whenReady().then(() => {
  const runtime = require.resolve("aijee/bin/aijee.cjs");
  server = spawn(process.execPath, [runtime, "serve"], { detached: true, stdio: "ignore" });
  server.once("error", (error) => {
    console.error(`Unable to start AiJee server: ${error.message}`);
  });
  server.unref();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
