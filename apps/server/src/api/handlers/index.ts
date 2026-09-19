import type { HandlerContext } from "./context.ts";
import * as release from "./release.ts";
import * as staticHandlers from "./static.ts";
import * as devices from "./devices.ts";
import * as workspaces from "./workspaces.ts";
import * as filesystem from "./filesystem.ts";
import * as sessions from "./sessions.ts";
import * as streaming from "./streaming.ts";
import * as tasks from "./tasks.ts";
import * as packages from "./packages.ts";
import * as models from "./models.ts";
import * as modes from "./modes.ts";
import * as preview from "./preview.ts";

const modules = [release, staticHandlers, devices, workspaces, filesystem, sessions, streaming, tasks, packages, models, modes, preview];

export function createHandlerContext(state: HandlerContext): HandlerContext {
  const ctx = Object.create(state) as HandlerContext;
  for (const module of modules) {
    for (const [name, handler] of Object.entries(module)) {
      if (typeof handler === "function") ctx[name] = (...args: unknown[]) => handler(ctx, ...args);
    }
  }
  return ctx;
}
