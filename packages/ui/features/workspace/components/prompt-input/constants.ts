import type { ModelThinkingLevel } from '@aijee/client-sdk';
import { ALL_THINKING_LEVELS } from '@aijee/client-sdk';

export interface SlashCommand {
  name: string;
  description: string;
}

export interface FlatModel {
  provider: string;
  modelId: string;
  modelName: string;
}

export type ThinkingLevel = ModelThinkingLevel;
export type ThinkingPreference = ThinkingLevel | 'auto';

export interface ThinkingLevelOption {
  level: ThinkingLevel;
  label: string;
  description: string;
}

/** Display metadata for the levels pi knows about. */
const THINKING_LEVEL_META: Record<ThinkingLevel, { label: string; description: string }> = {
  off: { label: 'Off', description: '' },
  minimal: { label: 'Minimal', description: '' },
  low: { label: 'Low', description: '' },
  medium: { label: 'Medium', description: '' },
  high: { label: 'High', description: '' },
  xhigh: { label: 'Xhigh', description: '' },
  max: { label: 'Max', description: '' },
};

/** Full canonical list, used as the fallback before a model is known. */
export const THINKING_LEVELS: ThinkingLevelOption[] = ALL_THINKING_LEVELS.map(
  (level) => ({ level, ...THINKING_LEVEL_META[level] }),
);

export function resolveAutoThinkingLevel(text: string, supported: readonly ThinkingLevel[]): ThinkingLevel {
  const score =
    (text.length > 1200 ? 2 : 0) +
    ((text.match(/\n/g)?.length ?? 0) > 12 ? 1 : 0) +
    (/(error|stack|bug|调试|重构|架构|多个文件|\btest\b)/i.test(text) ? 2 : 0);
  const desired: ThinkingLevel = score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';
  const order: ThinkingLevel[] = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
  const target = order.indexOf(desired);
  for (let distance = 0; distance < order.length; distance++) {
    const lower = order[target - distance];
    const upper = order[target + distance];
    if (lower && supported.includes(lower)) return lower;
    if (upper && supported.includes(upper)) return upper;
  }
  return supported[0] ?? 'off';
}

/** Human label for a level, tolerating levels we have no metadata for. */
export function thinkingLevelLabel(level: string): string {
  return THINKING_LEVEL_META[level as ThinkingLevel]?.label ?? `${level.charAt(0).toUpperCase()}${level.slice(1).toLowerCase()}`;
}

/**
 * Build the option list for the levels the agent reports as supported,
 * preserving the canonical order and keeping unknown levels visible.
 */
export function buildThinkingLevelOptions(
  levels: readonly string[] | null | undefined,
): ThinkingLevelOption[] {
  if (!levels || levels.length === 0) return THINKING_LEVELS.filter((item) => item.level !== 'off');
  return levels.filter((level) => level !== 'off').map((level) => ({
    level: level as ThinkingLevel,
    label: thinkingLevelLabel(level),
    description: THINKING_LEVEL_META[level as ThinkingLevel]?.description ?? '',
  }));
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'text';
  uri?: string;
  size?: number;
  preview?: string;
}

export const LARGE_PASTE_THRESHOLD = 500;
