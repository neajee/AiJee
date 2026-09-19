# AiJee Runtime

Embedded Pi SDK runtime and HTTP/SSE server for AiJee.

## Run

```bash
yarn runtime:start
```

Or directly:

```bash
node --experimental-strip-types src/main.ts serve
```

The runtime checks `http://127.0.0.1:10088/api/health` and serves the API,
auth, sessions and product services under `src/`. Set `AIJEE_SERVER_URL` to
point a client at another AiJee host.

## CLI

```text
aijee serve           start the runtime
aijee auth reset      reset authentication and revoke devices
```

API, auth, sessions and product services live under `src/`.
