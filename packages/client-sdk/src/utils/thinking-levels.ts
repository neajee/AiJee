import type { ModelInfo, ModelThinkingLevel } from "../types/stream-events";

/**
 * Every thinking level pi knows about, ordered from cheapest to deepest.
 * This ordering is also the display order.
 */
export const ALL_THINKING_LEVELS: readonly ModelThinkingLevel[] = [
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
];

/**
 * Resolve the thinking levels a specific model actually supports.
 *
 * Mirrors `getSupportedThinkingLevels` in pi-ai so the client offers exactly
 * the levels the agent would accept:
 * - a model without `reasoning` supports only `off`
 * - a level explicitly mapped to `null` is unsupported
 * - `xhigh` and `max` are opt-in: they only count when the model maps them
 *   explicitly
 *
 * When the model is unknown (not loaded yet) every level is returned, so the
 * UI degrades to the previous static behaviour instead of showing nothing.
 */
export function getSupportedThinkingLevels(
  model: ModelInfo | null | undefined,
): ModelThinkingLevel[] {
  if (!model) return [...ALL_THINKING_LEVELS];

  // `reasoning` is optional in our wire type. Treat an explicit `false` as
  // "no thinking support", but don't punish a model that simply omitted it.
  if (model.reasoning === false) return ["off"];

  const map = model.thinkingLevelMap;
  return ALL_THINKING_LEVELS.filter((level) => {
    const mapped = map?.[level];
    if (mapped === null) return false;
    if (level === "xhigh" || level === "max") return mapped !== undefined;
    return true;
  });
}

/**
 * True when the model can do extended thinking at all, i.e. it offers
 * something beyond `off`.
 */
export function supportsThinking(
  model: ModelInfo | null | undefined,
): boolean {
  return getSupportedThinkingLevels(model).some((level) => level !== "off");
}
