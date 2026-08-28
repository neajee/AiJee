import { useEffect } from "react";
import {
  useAgentConfig,
  type AgentConfigHandle,
} from "@pideck/client-sdk";

import { useAgentConfigCache } from "../store/config-cache";

/**
 * `useAgentConfig`, seeded from the last known values and writing back to them.
 *
 * The live values need a pi process, which takes seconds to spawn; the seeds
 * make the composer usable immediately. This wrapper is where the cache is
 * read and written, so the SDK hook stays free of storage concerns.
 */
export function useCachedAgentConfig(
  sessionId: string | null,
  options?: { enabled?: boolean },
): AgentConfigHandle {
  // The live request needs a running agent, so callers gate it on the session
  // being ready. The cache does not: it is read for the session on screen from
  // the first frame, which is the whole point.
  const liveSessionId = options?.enabled === false ? null : sessionId;
  const cachedModels = useAgentConfigCache((s) => s.models);
  const cachedState = useAgentConfigCache((s) =>
    sessionId ? s.stateBySession[sessionId] ?? null : null,
  );
  const rememberModels = useAgentConfigCache((s) => s.rememberModels);
  const rememberState = useAgentConfigCache((s) => s.rememberState);

  const config = useAgentConfig(liveSessionId, {
    seedState: cachedState,
    seedModels: cachedModels,
  });

  useEffect(() => {
    if (config.models && config.models.length > 0) {
      rememberModels(config.models);
    }
  }, [config.models, rememberModels]);

  useEffect(() => {
    if (sessionId && config.state) {
      rememberState(sessionId, config.state);
    }
  }, [sessionId, config.state, rememberState]);

  return config;
}
