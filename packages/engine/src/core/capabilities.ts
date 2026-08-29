export type EngineCapabilities = {
  models: boolean;
  tools: boolean;
  streaming: boolean;
  bash: boolean;
  steering: boolean;
  followUp: boolean;
  compaction: boolean;
  retry: boolean;
  fork: boolean;
  sessionHistory: boolean;
  extensions: boolean;
};

export const coreCapabilities: EngineCapabilities = {
  models: true,
  tools: true,
  streaming: true,
  bash: false,
  steering: true,
  followUp: true,
  compaction: false,
  retry: false,
  fork: false,
  sessionHistory: true,
  extensions: false,
};
