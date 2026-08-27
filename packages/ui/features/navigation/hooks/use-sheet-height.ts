import { useWindowDimensions } from "react-native";

interface SheetHeightOptions {
  /** Fraction of the window height the sheet should target. */
  fraction?: number;
  /** Never smaller than this, so content stays usable on short devices. */
  min?: number;
  /** Never larger than this, on tall devices / tablets. */
  max?: number;
}

/**
 * Compute a bottom-sheet height that adapts to the screen instead of a
 * hard-coded value. A fixed pixel height covers the whole screen on short
 * devices and only a sliver on tall ones; this keeps the sheet proportional
 * to the viewport while staying within a sane range.
 */
export function useSheetHeight({
  fraction = 0.72,
  min = 360,
  max = 620,
}: SheetHeightOptions = {}): number {
  const { height } = useWindowDimensions();
  const computed = Math.round(height * fraction);
  return Math.max(min, Math.min(max, computed));
}
