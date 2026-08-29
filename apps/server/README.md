# AiJee Pi Package

Install the plugin from Pi:

```bash
pi install npm:aijee
```

Then use these commands in Pi:

```text
/aijee         start or reuse the local Pi SDK runtime
/aijee-status  check runtime health
/aijee-stop    stop the runtime owned by this Pi session
```

The plugin checks `http://127.0.0.1:10088/api/health`, then starts or reuses the
embedded Pi SDK runtime in this package. Set `AIJEE_SERVER_URL` to connect to
another AiJee host; only loopback URLs are started automatically.

The Pi extension entry is `src/extension/index.ts`; API, auth, sessions and
product services live under `src/`.
