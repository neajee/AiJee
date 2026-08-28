import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import type { AgentStateData, ModelInfo } from "@pideck/client-sdk";

const STORAGE_KEY = "agent_config_cache";

/**
 * How many sessions keep a remembered snapshot.
 *
 * Only the sessions a user actually revisits matter, and the store has to fit
 * in SecureStore on native, which is unhappy with large values.
 */
const MAX_SESSIONS = 24;

/** Writes are coalesced: agent_state arrives repeatedly during a turn. */
const WRITE_DEBOUNCE_MS = 800;

interface PersistedShape {
  stateBySession: Record<string, AgentStateData>;
  order: string[];
}

interface AgentConfigCacheState extends PersistedShape {
  /**
   * The model list, shared by every session on the server.
   *
   * Kept in memory only — it is far too large for SecureStore, and its whole
   * job is to survive navigation between sessions, not app restarts.
   */
  models: ModelInfo[] | null;
  loaded: boolean;
  load: () => Promise<void>;
  rememberModels: (models: ModelInfo[]) => void;
  rememberState: (sessionId: string, state: AgentStateData) => void;
  forgetSession: (sessionId: string) => void;
}

async function readFromStore(): Promise<Partial<PersistedShape>> {
  try {
    const raw =
      Platform.OS === "web"
        ? localStorage.getItem(STORAGE_KEY)
        : await SecureStore.getItemAsync(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedShape) : {};
  } catch {
    return {};
  }
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleWrite(shape: PersistedShape) {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    void (async () => {
      try {
        const json = JSON.stringify(shape);
        if (Platform.OS === "web") {
          localStorage.setItem(STORAGE_KEY, json);
        } else {
          await SecureStore.setItemAsync(STORAGE_KEY, json);
        }
      } catch {
        // A cache that fails to persist is still a working in-memory cache.
      }
    })();
  }, WRITE_DEBOUNCE_MS);
}

/**
 * What the composer knew last time, so it need not wait for the pi process.
 *
 * Both the model list and the agent state come from the agent process, and
 * spawning one takes seconds. Showing the remembered model immediately — and
 * correcting it the moment the live snapshot lands — turns a multi-second
 * skeleton into a toolbar that is right almost always and stale briefly.
 */
export const useAgentConfigCache = create<AgentConfigCacheState>((set, get) => ({
  models: null,
  stateBySession: {},
  order: [],
  loaded: false,

  load: async () => {
    const stored = await readFromStore();
    set({
      stateBySession: stored.stateBySession ?? {},
      order: stored.order ?? [],
      loaded: true,
    });
  },

  rememberModels: (models) => {
    if (models.length === 0) return;
    set({ models });
  },

  rememberState: (sessionId, state) => {
    if (!sessionId) return;
    const current = get();
    if (current.stateBySession[sessionId] === state) return;

    const order = [
      sessionId,
      ...current.order.filter((id) => id !== sessionId),
    ].slice(0, MAX_SESSIONS);
    const stateBySession: Record<string, AgentStateData> = {};
    for (const id of order) {
      const entry = id === sessionId ? state : current.stateBySession[id];
      if (entry) stateBySession[id] = entry;
    }

    set({ stateBySession, order });
    scheduleWrite({ stateBySession, order });
  },

  forgetSession: (sessionId) => {
    const current = get();
    if (!current.stateBySession[sessionId]) return;
    const { [sessionId]: _dropped, ...stateBySession } = current.stateBySession;
    const order = current.order.filter((id) => id !== sessionId);
    set({ stateBySession, order });
    scheduleWrite({ stateBySession, order });
  },
}));
