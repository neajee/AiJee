import { create } from "zustand";
import type { StreamEvent } from "../types";
import {
  convertPiMessages,
  convertSessionEntries,
} from "./message-converter";
import {
  DEFAULT_CONNECTION_STATE,
  reduceStreamEvents,
  type AgentState,
} from "./reducers";

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: {},
  modes: {},
  pendingExtensionUiRequests: {},
  streaming: {},
  lastEventId: null,
  connection: DEFAULT_CONNECTION_STATE,
  reconnectNonce: 0,
  pendingPrompt: null,
  alertMessage: null,

  processStreamEvent: (event: StreamEvent) => {
    get().processStreamEvents([event]);
  },

  processStreamEvents: (events: StreamEvent[]) => {
    if (events.length === 0) return;
    set((state) => reduceStreamEvents(state, events));
  },

  setHistoryMessages: (sessionId: string, piMessages: any[]) => {
    const existing = get().messages[sessionId];
    const converted = convertPiMessages(piMessages);
    if (!existing || existing.length === 0) {
      set((state) => ({
        messages: { ...state.messages, [sessionId]: converted },
      }));
      return;
    }
    const isStreaming = get().streaming[sessionId];
    if (isStreaming) return;
    if (converted.length <= existing.length) return;
    set((state) => ({
      messages: { ...state.messages, [sessionId]: converted },
    }));
  },

  setHistoryEntries: (sessionId: string, entries: any[]) => {
    const existing = get().messages[sessionId];
    const converted = convertSessionEntries(entries);
    if (!converted.length) return;
    if (!existing || existing.length === 0) {
      set((state) => ({
        messages: { ...state.messages, [sessionId]: converted },
      }));
      return;
    }
    const isStreaming = get().streaming[sessionId];
    if (isStreaming) return;
    if (converted.length <= existing.length) return;
    set((state) => ({
      messages: { ...state.messages, [sessionId]: converted },
    }));
  },

  clearMessages: (sessionId: string) => {
    set((state) => {
      const { [sessionId]: _, ...rest } = state.messages;
      const { [sessionId]: ___, ...modeRest } = state.modes;
      const { [sessionId]: __, ...pendingRest } =
        state.pendingExtensionUiRequests;
      return {
        messages: rest,
        modes: modeRest,
        pendingExtensionUiRequests: pendingRest,
      };
    });
  },

  setConnectionState: (connection) => set({ connection }),

  requestReconnect: () =>
    set((state) => ({ reconnectNonce: state.reconnectNonce + 1 })),

  setPendingPrompt: (pending) => set({ pendingPrompt: pending }),

  setAlertMessage: (alertMessage) => set({ alertMessage }),

  setPendingExtensionUiRequest: (sessionId, pending) =>
    set((state) => ({
      pendingExtensionUiRequests: {
        ...state.pendingExtensionUiRequests,
        [sessionId]: pending,
      },
    })),
}));
