import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PI_MODEL_DEFAULTS,
  getContextWindow,
  getMaxTokens,
  hasKnownInputModalities,
  supportsImageInput,
} from "../src/utils/model-capabilities.ts";
import type { ModelInfo } from "../src/types/stream-events.ts";

function model(overrides: Partial<ModelInfo>): ModelInfo {
  return { id: "m", provider: "p", ...overrides };
}

test("a text-only model rejects images", () => {
  const m = model({ input: ["text"] });
  assert.equal(supportsImageInput(m), false);
  assert.equal(hasKnownInputModalities(m), true);
});

test("a multimodal model accepts images", () => {
  assert.equal(supportsImageInput(model({ input: ["text", "image"] })), true);
});

test("unknown modalities are permissive, not restrictive", () => {
  // Blocking on missing metadata would break image upload for capable models
  // behind an older server.
  assert.equal(supportsImageInput(model({})), true);
  assert.equal(supportsImageInput(null), true);
  assert.equal(hasKnownInputModalities(model({})), false);
  assert.equal(hasKnownInputModalities(model({ input: [] })), false);
});

test("context window and max tokens fall back to pi's defaults", () => {
  assert.equal(getContextWindow(model({})), PI_MODEL_DEFAULTS.contextWindow);
  assert.equal(getMaxTokens(model({})), PI_MODEL_DEFAULTS.maxTokens);
  assert.equal(getContextWindow(model({ contextWindow: 200_000 })), 200_000);
  assert.equal(getMaxTokens(model({ maxTokens: 64_000 })), 64_000);
});

// ---------------------------------------------------------------------------
// Pin the defaults against pi itself. If pi changes them, this fails loudly
// instead of silently showing the wrong placeholder / context percentage.
// ---------------------------------------------------------------------------

// pi 0.84 renamed `model-registry.js` to `provider-composer.js` and its
// parse function takes a `definition` instead of a `modelDef`.
const PI_REGISTRY_CANDIDATES = [
  "@earendil-works/pi-coding-agent/dist/core/provider-composer.js",
  "/home/zoelen/.nvm/versions/node/v24.13.0/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/provider-composer.js",
];

async function loadModelRegistrySource(): Promise<string | null> {
  const { readFile } = await import("node:fs/promises");
  for (const candidate of PI_REGISTRY_CANDIDATES) {
    try {
      return await readFile(candidate, "utf-8");
    } catch {
      // try the next candidate
    }
  }
  return null;
}

test("our fallback values match pi's parseModels defaults", async (t) => {
  const source = await loadModelRegistrySource();
  if (!source) {
    t.skip("pi-coding-agent not resolvable in this environment");
    return;
  }

  const contextWindow = source.match(
    /contextWindow:\s*definition\.contextWindow\s*\?\?\s*(\d+)/,
  );
  const maxTokens = source.match(
    /maxTokens:\s*definition\.maxTokens\s*\?\?\s*(\d+)/,
  );
  const input = source.match(
    /input:\s*\(definition\.input\s*\?\?\s*\[([^\]]*)\]/,
  );
  const reasoning = source.match(
    /reasoning:\s*definition\.reasoning\s*\?\?\s*(true|false)/,
  );

  assert.ok(contextWindow, "could not locate pi's contextWindow default");
  assert.ok(maxTokens, "could not locate pi's maxTokens default");
  assert.ok(input, "could not locate pi's input default");
  assert.ok(reasoning, "could not locate pi's reasoning default");

  assert.equal(Number(contextWindow[1]), PI_MODEL_DEFAULTS.contextWindow);
  assert.equal(Number(maxTokens[1]), PI_MODEL_DEFAULTS.maxTokens);
  assert.equal(input[1].replace(/["'\s]/g, ""), PI_MODEL_DEFAULTS.input.join(","));
  assert.equal(reasoning[1] === "true", PI_MODEL_DEFAULTS.reasoning);
});

test("real pi models declare their modalities, so gating is meaningful", async (t) => {
  let piAi: any;
  try {
    piAi = await import(
      "/home/zoelen/.nvm/versions/node/v24.13.0/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/providers/all.js"
    );
  } catch {
    t.skip("pi-ai not resolvable in this environment");
    return;
  }

  let textOnly = 0;
  let multimodal = 0;
  for (const provider of piAi.getBuiltinProviders() as string[]) {
    for (const m of piAi.getBuiltinModels(provider) as any[]) {
      assert.ok(
        Array.isArray(m.input) && m.input.length > 0,
        `${provider}/${m.id} has no input modalities`,
      );
      if (supportsImageInput(m)) multimodal++;
      else textOnly++;
    }
  }

  // Both buckets must be non-empty, otherwise the gate is either dead code or
  // blocks everything.
  assert.ok(textOnly > 0, "expected some text-only models");
  assert.ok(multimodal > 0, "expected some multimodal models");
  t.diagnostic(`${multimodal} multimodal / ${textOnly} text-only models`);
});
