import { useCallback, useState } from 'react';
import type { ToolCallInfo } from '../component-types';
import { basename, isToolActive, parseToolArguments } from '../utils/message-list';
import { detectLanguage, splitUnifiedDiff } from '../utils/diff';
export function useEditToolCallController(tc: ToolCallInfo) {
  const active = isToolActive(tc);
  const [expanded, setExpanded] = useState(false);
  const parsed = parseToolArguments(tc.arguments);
  const filePath = parsed.path as string || '';
  const fileName = basename(filePath);
  const detectedLanguage = detectLanguage(fileName, filePath);
  const rawDiff = tc.diff?.trim() || '';
  const rawEdits = Array.isArray(parsed.edits) ? parsed.edits : [];
  const editBlocks = rawEdits.length > 0 ? rawEdits.map(item => {
    const value = item as {
      oldText?: unknown;
      newText?: unknown;
    };
    return {
      oldText: typeof value.oldText === 'string' ? value.oldText : '',
      newText: typeof value.newText === 'string' ? value.newText : ''
    };
  }) : [{
    oldText: parsed.oldText as string || '',
    newText: parsed.newText as string || ''
  }];
  const fallbackDiff = editBlocks.flatMap(block => {
    const lines: string[] = [];
    if (block.oldText) lines.push(...block.oldText.split('\n').map(line => `-${line}`));
    if (block.newText) lines.push(...block.newText.split('\n').map(line => `+${line}`));
    return lines;
  }).join('\n');
  const diffText = rawDiff || fallbackDiff;
  // A unified diff reconstructs both sides exactly; the edit blocks are the
  // fallback when the runtime did not send one.
  const sides = rawDiff ? splitUnifiedDiff(rawDiff) : {
    oldValue: editBlocks.map(block => block.oldText).join('\n'),
    newValue: editBlocks.map(block => block.newText).join('\n')
  };
  const diffLines = diffText ? diffText.split('\n') : [];
  const removedLines = diffLines.filter(line => /^-(?!-)/.test(line)).length;
  const addedLines = diffLines.filter(line => /^\+(?!\+)/.test(line)).length;
  const toggle = useCallback(() => setExpanded(value => !value), []);
  return {
    active,
    expanded,
    toggle,
    filePath,
    fileName,
    detectedLanguage,
    oldValue: sides.oldValue,
    newValue: sides.newValue,
    hasDiff: Boolean(sides.oldValue || sides.newValue),
    removedLines,
    addedLines
  };
}
