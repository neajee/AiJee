import type { AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import type { JsonValue, PiDeckEvent } from "../../core/types.ts";

/**
 * Keeps Pi SDK types behind the runtime boundary. Client transport serializes
 * this envelope instead of depending on Pi's in-memory session objects.
 */
export function adaptAgentEvent(event: AgentSessionEvent): PiDeckEvent {
  return {
    type: event.type,
    data: event as unknown as JsonValue,
    timestamp: Date.now(),
  };
}
