import type { EngineSession } from "@aijee/engine";

/** Minimal in-memory EngineSession stand-in for HTTP and registry tests. */
export function fakeSession(sessionId: string, options: { cwd?: string; sessionFile?: string; messages?: unknown[] } = {}): EngineSession {
  const cwd = options.cwd ?? "/tmp/a";
  const sessionFile = options.sessionFile ?? `${sessionId}.jsonl`;
  const messages = options.messages ?? [];
  const listeners = new Set<(event: { type: string; data: null; timestamp: number }) => void>();
  const descriptor = { sessionId, sessionFile, cwd, streaming: false };
  const session = {
    capabilities: { models: true, tools: true, streaming: true, bash: true, steering: true, followUp: true, compaction: true, retry: true, fork: true, sessionHistory: true, extensions: true },
    sessionId,
    sessionFile,
    isStreaming: false,
    subscribe(listener: (event: { type: string; data: null; timestamp: number }) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    describe: () => descriptor,
    prompt: async () => undefined,
    steer: async () => undefined,
    followUp: async () => undefined,
    abort: async () => undefined,
    state: () => ({}),
    messages: () => messages,
    listModels: () => [{ provider: "test", id: "test-model" }],
    listTools: () => [],
    listThinkingLevels: () => ["off"],
    cycleModel: async () => undefined,
    cycleThinkingLevel: () => "off",
    setModel: async () => undefined,
    setThinkingLevel: () => undefined,
    setSteeringMode: () => undefined,
    setFollowUpMode: () => undefined,
    compact: async () => null,
    setAutoCompaction: () => undefined,
    setAutoRetry: () => undefined,
    abortRetry: () => undefined,
    abortBash: () => undefined,
    bash: async () => null,
    sessionStats: () => ({}),
    setSessionName: () => undefined,
    entries: () => messages.map((message, index) => ({ id: `entry-${index}`, type: "message", message })),
    tree: () => null,
    fork: async () => null,
    forkMessages: () => [],
    lastAssistantText: () => null,
    exportHtml: async () => "",
    commands: () => [],
    newSession: async () => descriptor,
    switchSession: async () => descriptor,
    dispose: async () => undefined,
  };
  return session as unknown as EngineSession;
}