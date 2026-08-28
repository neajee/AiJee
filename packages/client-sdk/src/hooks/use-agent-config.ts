import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePiClient } from "./context";
import type {
  ModelInfo,
  AgentStateData,
  ModelThinkingLevel,
} from "../types/stream-events";
import type { AgentMode } from "../types/chat-message";
import { getSupportedThinkingLevels } from "../utils/thinking-levels";
import {
  getContextWindow,
  supportsImageInput,
} from "../utils/model-capabilities";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

export interface UseAgentConfigOptions {
  /**
   * Last known values for this session, used until the live ones arrive.
   *
   * Both the model list and the agent state come from the pi process, which
   * takes seconds to spawn. Seeding lets the composer show the model it had
   * last time instead of a skeleton for the whole spawn.
   */
  seedState?: AgentStateData | null;
  seedModels?: ModelInfo[] | null;
}

export interface AgentConfigHandle {
  state: AgentStateData | null;
  models: ModelInfo[] | null;
  /**
   * The selected model, merged from the SSE state snapshot and the richer
   * entry in the models list. Use this for capability checks.
   */
  activeModel: ModelInfo | null;
  isLoading: boolean;
  error: string | null;
  /**
   * Thinking levels the currently selected model actually supports, derived
   * from the model the agent reports. Falls back to the full list while the
   * model is still unknown.
   */
  availableThinkingLevels: ModelThinkingLevel[];
  /** False when the current model cannot do extended thinking at all. */
  supportsThinking: boolean;
  /** False when the model is known to reject image input. */
  supportsImages: boolean;
  /** Effective context window of the current model, null while unknown. */
  contextWindow: number | null;
  setModel: (params: { provider: string; modelId: string }) => Promise<void>;
  setThinkingLevel: (level: string) => Promise<void>;
  setMode: (mode: AgentMode) => Promise<void>;
  reload: () => Promise<void>;
  retry: () => void;
}

export function useAgentConfig(
  sessionId: string | null,
  options?: UseAgentConfigOptions,
): AgentConfigHandle {
  const client = usePiClient();
  const [state, setState] = useState<AgentStateData | null>(
    options?.seedState ?? null,
  );
  const [models, setModels] = useState<ModelInfo[] | null>(
    options?.seedModels ?? null,
  );
  // Read through refs so a new seed object every render cannot re-trigger the
  // seeding effect and undo live data.
  const seedStateRef = useRef(options?.seedState ?? null);
  const seedModelsRef = useRef(options?.seedModels ?? null);
  seedStateRef.current = options?.seedState ?? null;
  seedModelsRef.current = options?.seedModels ?? null;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // The state belongs to one session, so switching sessions drops it and takes
  // that session's remembered snapshot instead. The model list is the same for
  // every session on a server, so it is kept.
  useEffect(() => {
    setState(seedStateRef.current);
    setModels((prev) => prev ?? seedModelsRef.current);
  }, [sessionId]);

  // Subscribe to agent_state from SSE
  useEffect(() => {
    if (!sessionId) return;

    const sub = client.agentState$(sessionId).subscribe((agentState) => {
      if (agentState && sessionIdRef.current === sessionId) {
        setState(agentState);
      }
    });

    return () => sub.unsubscribe();
  }, [client, sessionId]);

  // Fetch available models via REST (still needed, not in SSE)
  const loadModels = useCallback(
    async (attempt = 0) => {
      if (!sessionId) return;
      setIsLoading(true);
      setError(null);

      try {
        const modelsResult = await client.api.getAvailableModels(sessionId);
        if (sessionIdRef.current !== sessionId) return;
        setModels(modelsResult.models ?? []);
        attemptRef.current = 0;
        setIsLoading(false);
      } catch (err) {
        if (sessionIdRef.current !== sessionId) return;

        const nextAttempt = attempt + 1;
        if (nextAttempt < MAX_RETRIES) {
          attemptRef.current = nextAttempt;
          retryTimerRef.current = setTimeout(() => {
            if (sessionIdRef.current === sessionId) {
              loadModels(nextAttempt);
            }
          }, RETRY_DELAY_MS);
        } else {
          const message =
            err instanceof Error ? err.message : "Failed to load available models";
          setError(message);
          setIsLoading(false);
          attemptRef.current = 0;
        }
      }
    },
    [client, sessionId],
  );

  useEffect(() => {
    clearRetryTimer();
    attemptRef.current = 0;
    setError(null);
    loadModels();

    return () => {
      clearRetryTimer();
    };
  }, [loadModels, clearRetryTimer]);

  const retry = useCallback(() => {
    clearRetryTimer();
    attemptRef.current = 0;
    setError(null);
    loadModels(0);
  }, [loadModels, clearRetryTimer]);

  const setModel = useCallback(
    async (params: { provider: string; modelId: string }) => {
      if (!sessionId) return;

      const selectedModel = models?.find(
        (model) =>
          model.id === params.modelId &&
          (model.provider ?? "unknown") === params.provider,
      );

      setState((prev) =>
        prev
          ? {
              ...prev,
              model: {
                ...prev.model,
                id: params.modelId,
                provider: params.provider,
                name: selectedModel?.name ?? selectedModel?.id ?? params.modelId,
              },
            }
          : prev,
      );

      try {
        await client.setModel(sessionId, params);
      } catch {
        loadModels();
      }
    },
    [client, sessionId, loadModels, models],
  );

  const setThinkingLevel = useCallback(
    async (level: string) => {
      if (!sessionId) return;

      setState((prev) =>
        prev
          ? {
              ...prev,
              thinkingLevel: level,
            }
          : prev,
      );

      try {
        await client.setThinkingLevel(sessionId, level);
      } catch {
        loadModels();
      }
    },
    [client, sessionId, loadModels],
  );

  const setMode = useCallback(
    async (mode: AgentMode) => {
      if (!sessionId) return;

      setState((prev) =>
        prev
          ? {
              ...prev,
              mode,
            }
          : prev,
      );

      try {
        await client.prompt(sessionId, mode === "plan" ? "/plan" : "/chat");
      } catch {
        loadModels();
      }
    },
    [client, sessionId, loadModels],
  );

  // The agent_state model can be a trimmed snapshot, while the models list
  // always carries the full model descriptor (including thinkingLevelMap).
  // Prefer the richer entry so level detection stays accurate.
  const activeModel = useMemo<ModelInfo | null>(() => {
    const stateModel = state?.model ?? null;
    if (!stateModel) return null;
    const fromList = models?.find(
      (m) =>
        m.id === stateModel.id &&
        (m.provider ?? "unknown") === (stateModel.provider ?? "unknown"),
    );
    if (!fromList) return stateModel;
    // Merge so a field present only on the state snapshot is not lost.
    return { ...stateModel, ...fromList };
  }, [state?.model, models]);

  const availableThinkingLevels = useMemo(
    () => getSupportedThinkingLevels(activeModel),
    [activeModel],
  );

  const canThink = useMemo(
    () => availableThinkingLevels.some((level) => level !== "off"),
    [availableThinkingLevels],
  );

  return {
    state,
    models,
    activeModel,
    isLoading,
    error,
    availableThinkingLevels,
    supportsThinking: canThink,
    supportsImages: supportsImageInput(activeModel),
    contextWindow: activeModel ? getContextWindow(activeModel) : null,
    setModel,
    setThinkingLevel,
    setMode,
    reload: loadModels,
    retry,
  };
}
