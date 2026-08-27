import type { ModelThinkingLevel } from '@pideck/client-sdk';
import { ALL_THINKING_LEVELS } from '@pideck/client-sdk';

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

export interface ThinkingLevelOption {
  level: ThinkingLevel;
  label: string;
  description: string;
}

/** Display metadata for the levels pi knows about. */
const THINKING_LEVEL_META: Record<ThinkingLevel, { label: string; description: string }> = {
  off: { label: 'Off', description: 'No extended thinking' },
  minimal: { label: 'Minimal', description: 'Barely any reasoning' },
  low: { label: 'Low', description: 'Quick, concise responses' },
  medium: { label: 'Medium', description: 'Balanced depth and speed' },
  high: { label: 'High', description: 'Thorough, detailed responses' },
  xhigh: { label: 'Extra High', description: 'Deeper than high' },
  max: { label: 'Max', description: 'Maximum reasoning depth' },
};

/** Full canonical list, used as the fallback before a model is known. */
export const THINKING_LEVELS: ThinkingLevelOption[] = ALL_THINKING_LEVELS.map(
  (level) => ({ level, ...THINKING_LEVEL_META[level] }),
);

/** Human label for a level, tolerating levels we have no metadata for. */
export function thinkingLevelLabel(level: string): string {
  return THINKING_LEVEL_META[level as ThinkingLevel]?.label ?? level;
}

/**
 * Build the option list for the levels the agent reports as supported,
 * preserving the canonical order and keeping unknown levels visible.
 */
export function buildThinkingLevelOptions(
  levels: readonly string[] | null | undefined,
): ThinkingLevelOption[] {
  if (!levels || levels.length === 0) return THINKING_LEVELS;
  return levels.map((level) => ({
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
