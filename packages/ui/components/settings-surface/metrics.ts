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
  labelSize: number;
  descSize: number;
  valueSize: number;
  headerSize: number;
  headerInset: number;
  titleSize: number;
  chevronSize: number;
  switchScale: number;
  contentMaxWidth?: number;
}

const PHONE_METRICS: SettingsMetrics = {
  gutter: 16, groupGap: 22, cardRadius: 12, rowMinHeight: 48, rowPaddingV: 11,
  tileSize: 30, tileRadius: 8, tileIcon: 16, labelSize: 16, descSize: 13,
  valueSize: 15, headerSize: 13, headerInset: 16, titleSize: 30, chevronSize: 18, switchScale: 1,
};

const DESKTOP_METRICS: SettingsMetrics = {
  gutter: 10, groupGap: 10, cardRadius: 7, rowMinHeight: 32, rowPaddingV: 6,
  tileSize: 20, tileRadius: 5, tileIcon: 12, labelSize: 12, descSize: 10.5,
  valueSize: 12, headerSize: 10, headerInset: 2, titleSize: 18, chevronSize: 13,
  switchScale: 0.75, contentMaxWidth: 640,
};

export function useSettingsPhoneLayout(): boolean {
  const fromContext = useSettingsLayout();
  const { isWideScreen } = useResponsiveLayout();
  return fromContext ?? !isWideScreen;
}

export function useSettingsMetrics(): SettingsMetrics {
  return useSettingsPhoneLayout() ? PHONE_METRICS : DESKTOP_METRICS;
}
