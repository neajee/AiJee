import type { ModelInfo, ModelInputType } from "../types/stream-events";

/**
 * Defaults pi applies to a custom model that omits these fields
 * (see ModelRegistry.parseModels in pi-coding-agent).
 */
export const PI_MODEL_DEFAULTS: {
  readonly contextWindow: number;
  readonly maxTokens: number;
  readonly input: readonly ModelInputType[];
  readonly reasoning: boolean;
  readonly cost: {
    readonly input: number;
    readonly output: number;
    readonly cacheRead: number;
    readonly cacheWrite: number;
  };
} = {
  contextWindow: 128000,
  maxTokens: 16384,
  input: ["text"],
  reasoning: false,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
};

/**
 * Whether the model accepts image input.
 *
 * An absent `input` list means "unknown", not "text only": the agent reports
 * the field for every model it knows, so a gap comes from an older server or a
 * hand-written config. Restricting on unknown data would block attachments for
 * models that do support images, so unknown is treated as permissive and the
 * provider gets the final say.
 */
export function supportsImageInput(model?: ModelInfo | null): boolean {
  if (!model?.input) return true;
  return model.input.includes("image");
}

/** Whether the model's input modalities are known well enough to gate on. */
export function hasKnownInputModalities(model?: ModelInfo | null): boolean {
  return Array.isArray(model?.input) && model.input.length > 0;
}

/** Effective context window, falling back to pi's default for custom models. */
export function getContextWindow(model?: ModelInfo | null): number {
  return model?.contextWindow ?? PI_MODEL_DEFAULTS.contextWindow;
}

/** Effective max output tokens, falling back to pi's default. */
export function getMaxTokens(model?: ModelInfo | null): number {
  return model?.maxTokens ?? PI_MODEL_DEFAULTS.maxTokens;
}
