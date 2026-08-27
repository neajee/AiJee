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
