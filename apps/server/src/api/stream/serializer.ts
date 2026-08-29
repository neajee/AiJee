import type { ServerResponse } from "node:http";

export function openSse(response: ServerResponse): void {
  response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
}

export function sseFrame(payload: unknown): string {
  const id = payload && typeof payload === "object" && "id" in payload && typeof (payload as { id?: unknown }).id === "number" ? `id: ${(payload as { id: number }).id}\n` : "";
  return `${id}data: ${JSON.stringify(payload)}\n\n`;
}

export function keepAliveFrame(): string {
  return ": keepalive\n\n";
}
