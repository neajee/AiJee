export type AgentMode = "work" | "plan";

export function normalizeAgentMode(value: unknown): AgentMode | null {
  if (typeof value !== "string") return null;
  const mode = value.trim().toLowerCase();
  if (mode === "plan") return "plan";
  if (mode === "work" || mode === "chat") {
    return "work";
  }
  return null;
}

export function extractAgentMode(
  data: Record<string, any> | undefined,
): AgentMode | null {
  if (!data) return null;
  return (
    normalizeAgentMode(data.mode) ??
    normalizeAgentMode(data.currentMode) ??
    normalizeAgentMode(data.promptMode) ??
    normalizeAgentMode(data.chatMode) ??
    normalizeAgentMode(data.followUpMode) ??
    normalizeAgentMode(data.steeringMode)
  );
}

export function formatAgentModeLabel(mode: AgentMode): string {
  return mode === "plan" ? "Plan" : "Work";
}
