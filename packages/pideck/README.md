# PiDeck Pi Package

Install the plugin from Pi:

```bash
pi install npm:pideck
```

Then use these commands in Pi:

```text
/pideck         start or reuse the local gateway
/pideck-status  check gateway health
/pideck-stop    stop the gateway owned by this Pi session
```

The plugin first checks `http://127.0.0.1:5454/api/health`. Set
`PIDECK_SERVER_BIN` when the server binary is not available on `PATH`.
Set `PIDECK_SERVER_URL` to connect to another gateway; only loopback URLs are
started automatically.

The Pi extension entry is `src/extension/index.ts`; lifecycle and binary
resolution live in `src/runtime/`. The Rust gateway source is in `server/`.
