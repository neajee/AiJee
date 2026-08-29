# PiDeck Pi Package

Install the plugin from Pi:

```bash
pi install npm:pideck
```

Then use these commands in Pi:

```text
/pideck         start or reuse the local Pi SDK runtime
/pideck-status  check runtime health
/pideck-stop    stop the runtime owned by this Pi session
```

The plugin checks `http://127.0.0.1:5454/api/health`, then starts or reuses the
embedded Pi SDK runtime in this package. Set `PIDECK_SERVER_URL` to connect to
another PiDeck host; only loopback URLs are started automatically.

The Pi extension entry is `src/extension/index.ts`; API, auth, sessions and
product services live under `src/`.
