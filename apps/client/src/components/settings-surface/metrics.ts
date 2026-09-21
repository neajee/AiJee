import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useSettingsLayout } from './contexts';

export interface SettingsMetrics {
  gutter: number;
  groupGap: number;
  cardRadius: number;
  rowMinHeight: number;
  rowPaddingV: number;
  tileSize: number;
  tileRadius: number;
  tileIcon: number;
  headerInset: number;
  chevronSize: number;
  switchScale: number;
  contentMaxWidth?: number;
}

const PHONE_METRICS: SettingsMetrics = {
  gutter: 16, groupGap: 20, cardRadius: 9, rowMinHeight: 42, rowPaddingV: 9,
  tileSize: 24, tileRadius: 6, tileIcon: 13,
  headerInset: 16, chevronSize: 14, switchScale: 0.85,
};

const DESKTOP_METRICS: SettingsMetrics = {
  gutter: 14, groupGap: 12, cardRadius: 6, rowMinHeight: 32, rowPaddingV: 7,
  tileSize: 18, tileRadius: 4, tileIcon: 10,
  headerInset: 14, chevronSize: 11, switchScale: 0.7, contentMaxWidth: 640,
};

export function useSettingsPhoneLayout(): boolean {
  const fromContext = useSettingsLayout();
  const { isWideScreen } = useResponsiveLayout();
  return fromContext ?? !isWideScreen;
}

export function useSettingsMetrics(): SettingsMetrics {
  return useSettingsPhoneLayout() ? PHONE_METRICS : DESKTOP_METRICS;
}
