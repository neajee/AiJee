import { View } from 'tamagui';
import { useCallback, useRef, useState } from 'react';
import { Animated, Easing, useWindowDimensions, type View as RNView } from 'react-native';

import type { ToolCallInfo } from '../types';
import { basename, isToolActive, parseToolArguments } from '../utils/message-list';

function detectLanguage(fileName: string, filePath: string) {
  const lower = (fileName || filePath).toLowerCase();
  if (lower.endsWith('.tsx')) return 'tsx';
  if (lower.endsWith('.ts')) return 'ts';
  if (lower.endsWith('.jsx')) return 'jsx';
  if (lower.endsWith('.js')) return 'js';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
  if (lower.endsWith('.py')) return 'py';
  if (lower.endsWith('.sh')) return 'bash';
  if (lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.xml') || lower.endsWith('.svg')) return 'html';
  return undefined;
}

export function useEditToolCallController(tc: ToolCallInfo) {
  const { width, height } = useWindowDimensions();
  const active = isToolActive(tc);
  const [expanded, setExpanded] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [heroRect, setHeroRect] = useState({ x: 16, y: 120, width: Math.max(240, width - 32), height: 220 });
  const previewRef = useRef<RNView | null>(null);
  const heroProgress = useRef(new Animated.Value(0)).current;
  const parsed = parseToolArguments(tc.arguments);
  const filePath = (parsed.path as string) || '';
  const fileName = basename(filePath);
  const detectedLanguage = detectLanguage(fileName, filePath);
  const rawDiff = tc.diff?.trim() || '';
  const rawEdits = Array.isArray(parsed.edits) ? parsed.edits : [];
  const editBlocks = rawEdits.length > 0
    ? rawEdits.map((item) => {
        const value = item as { oldText?: unknown; newText?: unknown };
        return { oldText: typeof value.oldText === 'string' ? value.oldText : '', newText: typeof value.newText === 'string' ? value.newText : '' };
      })
    : [{ oldText: (parsed.oldText as string) || '', newText: (parsed.newText as string) || '' }];
  const fallbackDiff = editBlocks.flatMap((block) => {
    const lines: string[] = [];
    if (block.oldText) lines.push(...block.oldText.split('\n').map((line) => `-${line}`));
    if (block.newText) lines.push(...block.newText.split('\n').map((line) => `+${line}`));
    return lines;
  }).join('\n');
  const diffText = rawDiff || fallbackDiff;
  const diffLines = diffText ? diffText.split('\n') : [];
  const removedLines = diffLines.filter((line) => /^-(?!-)/.test(line)).length;
  const addedLines = diffLines.filter((line) => /^\+(?!\+)/.test(line)).length;

  const openFullscreen = useCallback(() => {
    const fallbackRect = { x: 16, y: 120, width: Math.max(240, width - 32), height: Math.min(260, height - 160) };
    const openFromRect = (nextRect: typeof fallbackRect) => {
      setHeroRect(nextRect);
      heroProgress.setValue(0);
      setFullscreenOpen(true);
      requestAnimationFrame(() => Animated.timing(heroProgress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start());
    };
    if (!previewRef.current) {
      openFromRect(fallbackRect);
      return;
    }
    previewRef.current.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      openFromRect(measuredWidth && measuredHeight ? { x, y, width: measuredWidth, height: measuredHeight } : fallbackRect);
    });
  }, [height, heroProgress, width]);
  const closeFullscreen = useCallback(() => {
    Animated.timing(heroProgress, { toValue: 0, duration: 220, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(({ finished }) => {
      if (finished) setFullscreenOpen(false);
    });
  }, [heroProgress]);

  return {
    active,
    expanded,
    setExpanded,
    fullscreenOpen,
    filePath,
    fileName,
    detectedLanguage,
    diffText,
    hasDiff: Boolean(diffText),
    removedLines,
    addedLines,
    width,
    height,
    previewRef,
    heroRect,
    heroProgress,
    openFullscreen,
    closeFullscreen,
  };
}
