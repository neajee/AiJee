export { SettingsLayoutProvider, SettingsHeadingProvider, useSettingsHeadingVisible } from './contexts';
export { useSettingsMetrics, useSettingsPhoneLayout, type SettingsMetrics } from './metrics';
export { useSettingsPalette, type SettingsPalette } from './palette';
export { SettingsGroup } from './group';
export { SettingsIconTile, SettingsRow, SettingsSwitch } from './row';

import { useMemo } from 'react';
import { useSettingsMetrics } from './metrics';

export function useSettingsContentStyle(bottomInset: number) {
  const m = useSettingsMetrics();
  return useMemo(() => ({ paddingHorizontal: m.gutter, paddingTop: m.gutter / 2, paddingBottom: bottomInset + 32, gap: m.groupGap, width: '100%' as const, maxWidth: m.contentMaxWidth, alignSelf: 'center' as const }), [bottomInset, m]);
}
