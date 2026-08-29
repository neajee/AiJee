export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type AgentEvent = {
  type: string;
  data: JsonValue;
  timestamp: number;
};
export type AiJeeEvent = AgentEvent;

export type SessionDescriptor = {
  sessionId: string;
  sessionFile?: string;
  cwd: string;
  streaming: boolean;
};

export type SessionEntry = JsonObject & { id: string; raw?: JsonValue };
export type ModelDescriptor = JsonObject & { provider: string; id: string; name?: string };
export type ToolDescriptor = JsonObject & { name: string; description?: string };
export type SessionStats = JsonObject;

export type CreateSessionInput = {
  cwd: string;
  sessionFile?: string;
};

export type SessionEventListener = (event: AgentEvent) => void;

/** One base64 image attachment on a user message. */
export type ImageAttachment = {
  type: "image";
  /** Base64 payload without the data-URL prefix. */
  data: string;
  mimeType: string;
};

/** Engine-neutral options for a user message. */
export type PromptInput = {
  images?: ImageAttachment[];
  /**
   * How the engine should place the message when a turn is already running.
   * pi rejects a prompt sent mid-stream without one.
   */
  streamingBehavior?: "steer" | "followUp";
};
