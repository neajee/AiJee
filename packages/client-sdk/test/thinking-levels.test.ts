import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ALL_THINKING_LEVELS,
  getSupportedThinkingLevels,
  supportsThinking,
} from "../src/utils/thinking-levels.ts";
import type { ModelInfo } from "../src/types/stream-events.ts";

function model(overrides: Partial<ModelInfo>): ModelInfo {
  return { id: "m", provider: "p", reasoning: true, ...overrides };
}

test("unknown model keeps every level so the picker never goes empty", () => {
  assert.deepEqual(getSupportedThinkingLevels(null), [...ALL_THINKING_LEVELS]);
  assert.deepEqual(getSupportedThinkingLevels(undefined), [
    ...ALL_THINKING_LEVELS,
  ]);
});

test("a non-reasoning model only supports off", () => {
  const m = model({ reasoning: false });
  assert.deepEqual(getSupportedThinkingLevels(m), ["off"]);
  assert.equal(supportsThinking(m), false);
});

test("reasoning model without a level map excludes xhigh", () => {
  const m = model({ reasoning: true });
  assert.deepEqual(getSupportedThinkingLevels(m), [
    "off",
    "minimal",
    "low",
    "medium",
    "high",
  ]);
  assert.equal(supportsThinking(m), true);
});

test("xhigh is offered once the model maps it explicitly", () => {
  const m = model({ thinkingLevelMap: { xhigh: "xhigh" } });
  assert.ok(getSupportedThinkingLevels(m).includes("xhigh"));
});

test("levels mapped to null are dropped", () => {
  const m = model({
    thinkingLevelMap: { minimal: null, low: null, xhigh: "max" },
  });
  assert.deepEqual(getSupportedThinkingLevels(m), [
    "off",
    "medium",
    "high",
    "xhigh",
  ]);
});

test("a model that omits reasoning is not restricted", () => {
  // Custom models may not report the flag; the agent clamps server-side, so
  // offering the levels is safer than hiding the control entirely.
  const m: ModelInfo = { id: "custom", provider: "custom" };
  assert.ok(getSupportedThinkingLevels(m).length > 1);
});

// ---------------------------------------------------------------------------
// Cross-check against the real pi-ai implementation, when pi is installed.
// This is what guarantees we offer exactly the levels the agent accepts.
// ---------------------------------------------------------------------------

const PI_AI_DIST_CANDIDATES = [
  "@earendil-works/pi-ai/dist",
  "/home/zoelen/.nvm/versions/node/v24.13.0/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist",
];

/**
 * pi 0.84 moved the catalog behind provider factories: `models.js` still owns
 * `getSupportedThinkingLevels`, while the built-in model list now comes from
 * `providers/all.js`.
 */
async function loadPiAiModels(): Promise<any | null> {
  for (const base of PI_AI_DIST_CANDIDATES) {
    try {
      const [models, all] = await Promise.all([
        import(`${base}/models.js`),
        import(`${base}/providers/all.js`),
      ]);
      return { ...models, ...all };
    } catch {
      // try the next candidate
    }
  }
  return null;
}

test("matches pi-ai getSupportedThinkingLevels for every known model", async (t) => {
  const piAi = await loadPiAiModels();
  if (!piAi?.getSupportedThinkingLevels || !piAi?.getBuiltinProviders) {
    t.skip("pi-ai not resolvable in this environment");
    return;
  }

  let compared = 0;
  for (const provider of piAi.getBuiltinProviders() as string[]) {
    for (const upstreamModel of piAi.getBuiltinModels(provider) as any[]) {
      const expected = piAi.getSupportedThinkingLevels(upstreamModel);
      // Feed only the fields that survive our wire format.
      const actual = getSupportedThinkingLevels({
        id: upstreamModel.id,
        provider: upstreamModel.provider,
        reasoning: upstreamModel.reasoning,
        thinkingLevelMap: upstreamModel.thinkingLevelMap,
      });
      assert.deepEqual(
        actual,
        expected,
        `mismatch for ${upstreamModel.provider}/${upstreamModel.id}`,
      );
      compared++;
    }
  }
  assert.ok(compared > 0, "expected at least one model to compare");
  t.diagnostic(`compared ${compared} models against pi-ai`);
});
