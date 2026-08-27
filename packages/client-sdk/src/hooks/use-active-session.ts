import { useMemo } from "react";
import { map, distinctUntilChanged } from "rxjs";
import { usePiClient } from "./context";
import { useObservable } from "./use-observable";

const EMPTY_SET: Set<string> = new Set();

/** Every session the server currently reports as running. */
export function useActiveSessions(): Set<string> {
  const client = usePiClient();
  return useObservable(client.activeSessions$, EMPTY_SET);
}

/**
 * Sessions whose agent is mid-turn.
 *
 * Prefer this over {@link useActiveSessions} for "is it working?" — an active
 * session may simply have a live process sitting idle.
 */
export function useStreamingSessions(): Set<string> {
  const client = usePiClient();
  return useObservable(client.streamingSessions$, EMPTY_SET);
}

export function useIsSessionStreaming(sessionId: string | null): boolean {
  const client = usePiClient();

  const streaming$ = useMemo(() => {
    if (!sessionId) return null;
    const sid = sessionId;
    return client.streamingSessions$.pipe(
      map((set) => set.has(sid)),
      distinctUntilChanged(),
    );
  }, [client, sessionId]);

  return useObservable(streaming$!, false);
}

export function useIsSessionActive(sessionId: string | null): boolean {
  const client = usePiClient();

  const active$ = useMemo(() => {
    if (!sessionId) return null;
    const sid = sessionId;
    return client.activeSessions$.pipe(
      map((set) => set.has(sid)),
      distinctUntilChanged(),
    );
  }, [client, sessionId]);

  return useObservable(active$!, false);
}
