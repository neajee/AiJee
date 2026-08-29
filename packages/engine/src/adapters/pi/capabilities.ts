import type { EngineCapabilities } from "../../core/capabilities.ts";

export const piCapabilities: EngineCapabilities = {
  models: true,
  tools: true,
  streaming: true,
  bash: true,
  steering: true,
  followUp: true,
  compaction: true,
  retry: true,
  fork: true,
  sessionHistory: true,
  extensions: true,
};
