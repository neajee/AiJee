const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const { resolveServerBinary } = require("../../../packages/pideck/src/runtime/server-binary.cjs");

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
  window.loadURL(process.env.PIDECK_CLIENT_URL || "http://localhost:8081");
}

app.whenReady().then(() => {
  server = spawn(resolveServerBinary(), ["--headless"], { detached: true, stdio: "ignore" });
  server.once("error", (error) => {
    console.error(`Unable to start PiDeck server: ${error.message}`);
  });
  server.unref();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
