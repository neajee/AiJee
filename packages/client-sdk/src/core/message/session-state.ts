import type { ChatMessage, ProductAgentMode, PendingExtensionUiRequest } from "../../types/chat-message";
import type { AgentStateData } from "@aijee/protocol";

export interface SessionState {
  messages: ChatMessage[];
  isStreaming: boolean;
  isReady: boolean;
  isLoading: boolean;
  isLoadingOlderMessages: boolean;
  hasMoreMessages: boolean;
  oldestEntryId: string | null;
  mode: ProductAgentMode;
  pendingExtensionUiRequest: PendingExtensionUiRequest | null;
  steeringQueue: string[];
  followUpQueue: string[];
  agentState: AgentStateData | null;
}

export function createEmptySessionState(): SessionState {
  return {
    messages: [],
    isStreaming: false,
    isReady: false,
    agentState: null,
    isLoading: false,
    isLoadingOlderMessages: false,
    hasMoreMessages: false,
    oldestEntryId: null,
    mode: "work",
    pendingExtensionUiRequest: null,
    steeringQueue: [],
    followUpQueue: [],
  };
}

export function isModeSlashCommand(message: string): boolean {
  return message.trim().startsWith("/");
}
