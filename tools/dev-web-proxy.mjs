import { createServer, request } from "node:http";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";

const listenPort = Number(process.env.AIJEE_WEB_PORT ?? 8081);
const listenHost = process.env.AIJEE_WEB_HOST ?? process.env.AIJEE_HOST ?? "127.0.0.1";
const apiPort = Number(process.env.AIJEE_API_PORT ?? 10088);
const expoPort = Number(process.env.AIJEE_EXPO_PORT ?? 8082);

function targetFor(pathname) {
  return pathname.startsWith("/api/") || pathname === "/health" || pathname === "/healthz" || pathname === "/version"
    ? apiPort
    : expoPort;
}

function upstreamHeaders(requestFromClient, targetPort) {
  const headers = {
    ...requestFromClient.headers,
    host: `127.0.0.1:${targetPort}`,
    "x-forwarded-for": requestFromClient.socket.remoteAddress ?? "",
  };
  if (targetPort === expoPort) {
    if (headers.origin) headers.origin = `http://127.0.0.1:${expoPort}`;
    if (headers.referer) headers.referer = `http://127.0.0.1:${expoPort}/`;
  }
  return headers;
}

function proxy(requestFromClient, responseToClient) {
  if ((requestFromClient.url ?? "").split("?", 1)[0] === "/preview-sw.js") {
    responseToClient.writeHead(200, {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
      "service-worker-allowed": "/",
    });
    createReadStream(fileURLToPath(new URL("../public/preview-sw.js", import.meta.url))).pipe(responseToClient);
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
