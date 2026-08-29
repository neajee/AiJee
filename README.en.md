# PiDeck

PiDeck — Pi Coding Agent everywhere.

[中文](README.md)

A multi-platform companion app for [pi-coding-agent](https://github.com/badlogic/pi-mono/). Run PiDeck on your computer, connect from your phone, and control your coding agent remotely.

## Quick Start

### 1. Install with Pi

```bash
pi install npm:pideck
```

The plugin starts or reuses the embedded Pi SDK runtime in the same `pideck`
installation unit.

### 2. Standalone installation

For servers, NAS devices, or computers without a Pi TUI session:

```bash
npm install -g pideck
pideck serve
```

Rust, Cargo, and a global Pi CLI are not required. The package contains the Pi SDK runtime, hosted API, and web assets.

On first launch PiDeck creates `~/.pideck/` and prints a setup code.

### 3. First launch

```bash
pideck serve
```

PiDeck starts on port **5454** and prints a setup code in the terminal:

```
  Setup code: ...
```

### 4. Connect from the mobile app

1. Install the Pico app on your Android device (APK available in releases)
2. Open the app and add a PiDeck host
3. Enter the setup code shown in your terminal
4. Complete setup and sign in

You're connected! You can now create workspaces, start coding sessions, and interact with the pi-coding-agent from your phone.

### Pi plugin bootstrap

```bash
pi install npm:pideck
```

## Architecture

```text
apps/client + apps/desktop → packages/ui → packages/client-sdk
apps/server → packages/engine → Pi / Codex / OpenCode SDK
```

Desktop, Web, and remote-server use are launch modes of the same runtime, not
separately deployed backends. Android and iOS remain connection clients. See
[the architecture specification](docs/spec/architecture.md).

## Screenshots

### Mobile — Workspace & Sessions
<p float="left">
  <img src="docs/screenshots/mobile-workspace-home.png" width="250" alt="Workspace home screen" />
  <img src="docs/screenshots/mobile-workspaces-sessions.jpeg" width="250" alt="Workspaces and session list" />
</p>

### Mobile — Chat & Settings
<p float="left">
  <img src="docs/screenshots/mobile-chat-mode.jpeg" width="250" alt="Chat mode with custom model" />
  <img src="docs/screenshots/mobile-settings.jpeg" width="250" alt="Settings - agent, custom models, appearance" />
</p>

### Tablet & Desktop
<p float="left">
  <img src="docs/screenshots/tablet-session-sidebar.jpg" width="400" alt="Tablet view with session sidebar" />
</p>

<img src="docs/screenshots/desktop-code-session.png" width="700" alt="Desktop view - code session with file preview" />

## Configuration

The runtime state file is `~/.pideck/runtime.json`. Configure the listener with:

```toml
PIDECK_HOST=0.0.0.0
PIDECK_PORT=5454
PIDECK_STATE_PATH=~/.pideck/runtime.json
```

## Architecture

```text
pideck package (Pi SDK + Runtime + HTTP/SSE + Web assets)
        ↑
PiDeck Client (Web / Mobile / Desktop)
```

## Development

### Prerequisites

- Node.js 22+
- Yarn 4 (via Corepack: `corepack enable && corepack prepare yarn@4.9.2 --activate`)
- Java 17 (for Android builds)

### Run the mobile app (dev)

On first launch, open `http://localhost:5454/setup` and enter the setup code printed by PiDeck. Reset administrator credentials and revoke all login and paired-device tokens with `pideck auth reset`.

```bash
yarn install
yarn start        # Expo dev server
yarn android      # run on Android
yarn web          # run in browser
yarn runtime:check # check the Pi SDK runtime
yarn runtime:start # start the runtime web service
yarn desktop      # start the desktop shell
```

For direct browser login links, the backend prints `http://localhost:8081/connect?...` in debug builds and uses the backend server port in release builds. Set `PI_UI_WEB_ORIGIN` to override the dev web origin if you run Expo web on a different host or port.

### Build the web client

```bash
yarn web:build              # export web assets to dist/
yarn runtime:check          # validate the embedded runtime
```

### Build Android APK

```bash
cd apps/client && eas build --platform android --profile preview --local
```

Requires Java 17 (`JAVA_HOME` must point to a JDK 17 installation).
