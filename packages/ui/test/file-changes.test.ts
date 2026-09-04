import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collectFileChanges,
  relativePath,
} from "../features/agent/utils/message-list.ts";
import type { ToolCallInfo } from "../features/agent/types.ts";

function tool(partial: Partial<ToolCallInfo>): ToolCallInfo {
  return {
    id: partial.id ?? "t1",
    name: partial.name ?? "edit",
    arguments: partial.arguments ?? "{}",
    status: partial.status ?? "complete",
    ...partial,
  } as ToolCallInfo;
}

test("an edit is counted from its diff", () => {
  const changes = collectFileChanges([
    tool({
      name: "edit",
      arguments: JSON.stringify({ path: "src/a.ts" }),
      diff: ["-old line", "+new line", "+extra line", " context"].join("\n"),
    }),
  ]);

  assert.deepEqual(changes, [
    { path: "src/a.ts", kind: "edited", added: 2, removed: 1 },
  ]);
});

test("an edit without a diff falls back to its arguments", () => {
  const changes = collectFileChanges([
    tool({
      name: "edit",
      arguments: JSON.stringify({
        path: "src/b.ts",
        edits: [{ oldText: "a\nb", newText: "c" }],
      }),
    }),
  ]);

  assert.deepEqual(changes, [
    { path: "src/b.ts", kind: "edited", added: 1, removed: 2 },
  ]);
});

test("a write counts its content as additions and reads as created", () => {
  const changes = collectFileChanges([
    tool({
      name: "write",
      arguments: JSON.stringify({ path: "src/c.ts", content: "one\ntwo\nthree" }),
    }),
  ]);

  assert.deepEqual(changes, [
    { path: "src/c.ts", kind: "created", added: 3, removed: 0 },
  ]);
});

test("repeated edits to one file collapse into a single row", () => {
  const changes = collectFileChanges([
    tool({ id: "t1", arguments: JSON.stringify({ path: "src/a.ts" }), diff: "+one" }),
    tool({ id: "t2", arguments: JSON.stringify({ path: "src/a.ts" }), diff: "-two\n+three" }),
  ]);

  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0], {
    path: "src/a.ts",
    kind: "edited",
    added: 2,
    removed: 1,
  });
});

test("a write after an edit reports the file as created", () => {
  const changes = collectFileChanges([
    tool({ id: "t1", name: "edit", arguments: JSON.stringify({ path: "src/a.ts" }), diff: "+one" }),
    tool({
      id: "t2",
      name: "write",
      arguments: JSON.stringify({ path: "src/a.ts", content: "one" }),
    }),
  ]);

  assert.equal(changes[0]?.kind, "created");
});

test("failed and cancelled calls leave the file out", () => {
  const changes = collectFileChanges([
    tool({ id: "t1", arguments: JSON.stringify({ path: "src/a.ts" }), diff: "+one", isError: true }),
    tool({ id: "t2", arguments: JSON.stringify({ path: "src/b.ts" }), diff: "+one", status: "cancelled" }),
    tool({ id: "t3", arguments: JSON.stringify({ path: "src/c.ts" }), diff: "+one", status: "error" }),
  ]);

  assert.deepEqual(changes, []);
});

test("tools that do not touch files are ignored", () => {
  const changes = collectFileChanges([
    tool({ name: "read", arguments: JSON.stringify({ path: "src/a.ts" }) }),
    tool({ name: "bash", arguments: JSON.stringify({ command: "ls" }) }),
  ]);

  assert.deepEqual(changes, []);
});

test("a truncated streaming argument still yields the path", () => {
  const changes = collectFileChanges([
    tool({
      name: "edit",
      // Streaming arguments arrive as partial JSON.
      arguments: '{"path":"src/a.ts","edits":[{"oldText":"a',
      diff: "+one",
    }),
  ]);

  assert.deepEqual(changes, [
    { path: "src/a.ts", kind: "edited", added: 1, removed: 0 },
  ]);
});

test("a path inside the workspace is shown relative to it", () => {
  assert.equal(
    relativePath("/home/me/proj/packages/ui/index.tsx", "/home/me/proj"),
    "packages/ui/index.tsx",
  );
});

test("a trailing slash on the root is tolerated", () => {
  assert.equal(relativePath("/home/me/proj/a.ts", "/home/me/proj/"), "a.ts");
});

test("a path outside the workspace stays absolute", () => {
  assert.equal(
    relativePath("/etc/hosts", "/home/me/proj"),
    "/etc/hosts",
  );
});

test("a sibling directory sharing the root's prefix is not stripped", () => {
  assert.equal(
    relativePath("/home/me/proj-old/a.ts", "/home/me/proj"),
    "/home/me/proj-old/a.ts",
  );
});

test("an already relative path is left alone", () => {
  assert.equal(relativePath("packages/ui/index.tsx", "/home/me/proj"), "packages/ui/index.tsx");
});

test("without a workspace root the path is untouched", () => {
  assert.equal(relativePath("/home/me/proj/a.ts", null), "/home/me/proj/a.ts");
});

test("the workspace root itself shows as its own name", () => {
  assert.equal(relativePath("/home/me/proj", "/home/me/proj"), "proj");
});

test("windows separators are normalised", () => {
  assert.equal(relativePath("C:\\work\\proj\\src\\a.ts", "C:\\work\\proj"), "src/a.ts");
});
