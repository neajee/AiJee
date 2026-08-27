/**
 * Pulls the running-session ids out of an `active_sessions` frame.
 *
 * The server sends it as a regular `StreamEvent`, whose `event_type` serialises
 * to `type` and whose payload stays in `data` — so the ids are nested. A flat
 * shape is accepted too, since that is how the event reads on the wire
 * elsewhere. Returns null when the frame isn't a usable `active_sessions`,
 * which is how the caller knows to fall through to normal event parsing rather
 * than clearing the set on a malformed frame.
 */
export function extractActiveSessionIds(
  frame: Record<string, unknown>,
): string[] | null {
  if (frame["type"] !== "active_sessions") return null;

  const nested = frame["data"] as Record<string, unknown> | undefined;
  const candidates = [frame["session_ids"], nested?.["session_ids"]];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((id): id is string => typeof id === "string");
    }
  }

  return null;
}
