
// ─── Inline thinking ─────────────────────────────────────────
//
// Most providers hand reasoning over as its own content block, which pi-ai
// normalises to `{ type: "thinking" }`. Some DeepSeek-compatible endpoints —
// self-hosted vLLM/Ollama builds of the R1 family, and third-party proxies —
// instead wrap it in `<think>` tags inside the ordinary message text. Without
// this split the user reads the raw tags and the whole chain of thought as if
// it were the answer.
//
// Lives here rather than in its own module because this file has to stay
// runtime-import-free: the test runner resolves it directly, and a bare
// specifier without a file extension would fail to load.

const THINKING_TAGS = ["think", "thinking"] as const;

/** Cheap pre-check so the common case (no tags at all) costs one scan. */
export function hasInlineThinking(text: string): boolean {
  return text.includes("<think");
}

export function splitInlineThinking(text: string): { text: string; thinking: string } {
  if (!text || !hasInlineThinking(text)) return { text, thinking: "" };

  let rest = text;
  let answer = "";
  const thoughts: string[] = [];

  while (rest.length > 0) {
    const open = findThinkingOpenTag(rest);
    if (!open) {
      answer += rest;
      break;
    }

    answer += rest.slice(0, open.index);
    const afterOpen = rest.slice(open.index + open.length);
    const closeTag = `</${open.tag}>`;
    const closeIndex = afterOpen.indexOf(closeTag);

    if (closeIndex === -1) {
      // Unterminated: still streaming, so the remainder is thinking so far.
      thoughts.push(afterOpen);
      break;
    }

    thoughts.push(afterOpen.slice(0, closeIndex));
    rest = afterOpen.slice(closeIndex + closeTag.length);
  }

  return {
    // Removing a block usually leaves the blank lines that surrounded it.
    text: answer.replace(/\n{3,}/g, "\n\n").trimStart(),
    thinking: thoughts.join("\n\n").trim(),
  };
}

function findThinkingOpenTag(
  text: string,
): { index: number; length: number; tag: string } | null {
  let best: { index: number; length: number; tag: string } | null = null;

  for (const tag of THINKING_TAGS) {
    const open = `<${tag}>`;
    const index = text.indexOf(open);
    if (index === -1) continue;
    if (!best || index < best.index) best = { index, length: open.length, tag };
  }

  return best;
}

/**
 * Folds any inline thinking out of `text` and onto `thinking`.
 *
 * Returns the same object when there is nothing to move, so reducers can call
 * it on every delta without forcing a re-render.
 */
export function normalizeInlineThinking<
  T extends { text?: string; thinking?: string },
>(message: T): T {
  const text = message.text;
  if (!text || !hasInlineThinking(text)) return message;

  const split = splitInlineThinking(text);
  // Gate on "did the text change", not "did we extract anything": the opening
  // tag can arrive a frame before its content, and it must not flash in the UI.
  if (split.text === text && !split.thinking) return message;

  // Inline thinking is *derived* from the text, so every frame recomputes the
  // whole thing — appending would repeat it. It only ever gets appended when the
  // message already carries unrelated thinking, i.e. a provider that somehow
  // sends both a thinking block and inline tags.
  const existing = message.thinking ?? "";
  let thinking: string;
  if (!split.thinking) {
    thinking = existing;
  } else if (existing.includes(split.thinking)) {
    thinking = existing;
  } else if (!existing || split.thinking.startsWith(existing)) {
    thinking = split.thinking;
  } else {
    thinking = `${existing}\n\n${split.thinking}`;
  }

  return { ...message, text: split.text, thinking };
}
