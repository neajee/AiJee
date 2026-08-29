export type TelemetryEvent = { name: string; timestamp: number; fields?: Record<string, unknown> };

export function recordTelemetry(name: string, fields?: Record<string, unknown>): TelemetryEvent {
  const event = { name, timestamp: Date.now(), fields };
  process.stderr.write(`${JSON.stringify({ level: "info", ...event })}\n`);
  return event;
}
