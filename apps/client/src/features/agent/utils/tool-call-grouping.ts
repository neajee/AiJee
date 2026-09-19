import type { ToolCallInfo } from '../types';
import { basename, parseToolArguments, toolDisplayName } from './message-list';

const NEVER_GROUP = new Set(['bash', 'write', 'edit', 'subagent']);

export interface RenderGroup {
  key: string;
  toolName: string;
  calls: ToolCallInfo[];
}

export function groupToolCalls(toolCalls: ToolCallInfo[]): RenderGroup[] {
  if (!toolCalls.length) return [];
  const result: RenderGroup[] = [];
  for (const call of toolCalls) {
    const stableId = call.previousId ?? call.id;
    if (NEVER_GROUP.has(call.name)) {
      result.push({ key: `s-${stableId}`, toolName: call.name, calls: [call] });
    } else {
      const last = result[result.length - 1];
      if (last && last.toolName === call.name && !NEVER_GROUP.has(last.toolName)) last.calls.push(call);
      else result.push({ key: `g-${stableId}`, toolName: call.name, calls: [call] });
    }
  }
  return result;
}

export function formatSingleLine(call: ToolCallInfo): string {
  const parsed = parseToolArguments(call.arguments);
  switch (call.name) {
    case 'read':
    case 'write':
    case 'edit': {
      const name = parsed.path ? basename(parsed.path as string) : 'file';
      return `${call.name[0].toUpperCase()}${call.name.slice(1)} ${name}`;
    }
    case 'bash': {
      const command = (parsed.command as string) || 'command';
      return `$ ${command.length > 50 ? `${command.slice(0, 50)}…` : command}`;
    }
    default:
      return toolDisplayName(call.name);
  }
}
