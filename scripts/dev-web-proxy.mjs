import { createServer, request } from "node:http";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";

const listenPort = Number(process.env.AIJEE_WEB_PORT ?? 8081);
const listenHost = process.env.AIJEE_WEB_HOST ?? process.env.AIJEE_HOST ?? "0.0.0.0";
const apiPort = Number(process.env.AIJEE_API_PORT ?? 10088);
const frontendPort = Number(process.env.AIJEE_FRONTEND_PORT ?? 8082);

function targetFor(pathname) {
  return pathname.startsWith("/api/") || pathname === "/health" || pathname === "/healthz" || pathname === "/version"
    ? apiPort
    : frontendPort;
}

function upstreamHeaders(requestFromClient, targetPort) {
  const headers = {
    ...requestFromClient.headers,
    "x-forwarded-for": requestFromClient.socket.remoteAddress ?? "",
    "x-forwarded-host": requestFromClient.headers.host ?? `127.0.0.1:${listenPort}`,
    "x-forwarded-proto": "http",
  };
  // The runtime uses Origin + Host to distinguish an owner opening its local
  // UI from a remote device. Preserve the public host for API requests; Vite
  // still needs its internal host for HMR and asset delivery.
  headers.host = targetPort === apiPort
    ? requestFromClient.headers.host ?? `127.0.0.1:${listenPort}`
    : `127.0.0.1:${targetPort}`;
  if (targetPort === frontendPort) {
    if (headers.origin) headers.origin = `http://127.0.0.1:${frontendPort}`;
    if (headers.referer) headers.referer = `http://127.0.0.1:${frontendPort}/`;
  }
  return headers;
}

function proxy(requestFromClient, responseToClient) {
  if ((requestFromClient.url ?? "").split("?", 1)[0] === "/_aijee/dev-health") {
    responseToClient.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    responseToClient.end("ok");
    return;
  }
  if ((requestFromClient.url ?? "").split("?", 1)[0] === "/preview-sw.js") {
    responseToClient.writeHead(200, {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
      "service-worker-allowed": "/",
    });
    createReadStream(fileURLToPath(new URL("../apps/web/public/preview-sw.js", import.meta.url))).pipe(responseToClient);
    return;
  }
  const targetPort = targetFor(requestFromClient.url ?? "/");
  const upstream = request({
    hostname: "127.0.0.1",
    port: targetPort,
    path: requestFromClient.url,
    method: requestFromClient.method,
    headers: upstreamHeaders(requestFromClient, targetPort),
  }, (upstreamResponse) => {
    responseToClient.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
    upstreamResponse.pipe(responseToClient);
  });
  upstream.once("error", () => {
    if (!responseToClient.headersSent) responseToClient.writeHead(503);
    responseToClient.end("Development service is starting");
  });
  requestFromClient.pipe(upstream);
}

const server = createServer(proxy);
server.on("upgrade", (requestFromClient, clientSocket, head) => {
  const targetPort = targetFor(requestFromClient.url ?? "/");
  const upstream = request({
    hostname: "127.0.0.1",
    port: targetPort,
    path: requestFromClient.url,
    method: requestFromClient.method,
    headers: upstreamHeaders(requestFromClient, targetPort),
  });
  upstream.once("upgrade", (upstreamResponse, upstreamSocket, upstreamHead) => {
    clientSocket.write(`HTTP/1.1 ${upstreamResponse.statusCode ?? 101} ${upstreamResponse.statusMessage ?? "Switching Protocols"}\r\n`);
    for (const [name, value] of Object.entries(upstreamResponse.headers)) {
      if (value !== undefined) clientSocket.write(`${name}: ${Array.isArray(value) ? value.join(", ") : value}\r\n`);
    }
    clientSocket.write("\r\n");
    if (upstreamHead.length) clientSocket.write(upstreamHead);
    if (head.length) upstreamSocket.write(head);
    upstreamSocket.pipe(clientSocket).pipe(upstreamSocket);
  });
  upstream.once("error", () => clientSocket.destroy());
  upstream.end();
});

server.listen(listenPort, listenHost, () => {
  process.stdout.write(`AiJee development proxy listening on ${listenHost}:${listenPort}\n`);
});
