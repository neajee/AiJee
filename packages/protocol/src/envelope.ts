import type { AgentStreamEvent, ServerEvent } from "./events.ts";

export interface StreamEventEnvelope {
  id: number;
  session_id: string;
  workspace_id?: string;
  type: string;
  data: AgentStreamEvent;
  timestamp: number;
}
