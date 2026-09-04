import { useMemo } from 'react';
import { useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import {
  addNativeStyles,
  addWebStyles,
  apiNativeStyles,
  apiWebStyles,
  cardNativeStyles,
  cardWebStyles,
  fieldNativeStyles,
  fieldWebStyles,
  modelNativeStyles,
  modelWebStyles,
  sectionNativeStyles,
  sectionWebStyles,
} from '../utils/custom-models-styles';

// ─── Shared theme helper ──────────────────────────────────────

/**
 * Density follows the viewport rather than `Platform.OS`, so mobile web gets
 * the same roomy layout as the native builds. `isNative` remains an override.
 */
export function useColors(isDark: boolean, isNative?: boolean) {
  const phone = useSettingsPhoneLayout();
  const roomy = isNative ?? phone;
  const p = useSettingsPalette();

  return useMemo(
    () => ({
      roomy,
      s: roomy
        ? {
            section: sectionNativeStyles,
            card: cardNativeStyles,
            model: modelNativeStyles,
            field: fieldNativeStyles,
            api: apiNativeStyles,
            add: addNativeStyles,
          }
        : {
            section: sectionWebStyles,
            card: cardWebStyles,
            model: modelWebStyles,
            field: fieldWebStyles,
            api: apiWebStyles,
            add: addWebStyles,
          },
      textPrimary: p.text,
      textSecondary: p.textSecondary,
      textMuted: p.textTertiary,
      inputBg: p.tile,
      borderColor: p.separator,
      cardBg: p.card,
      headerBg: p.tile,
      accentBg: p.tile,
      chipActiveBg: p.tile,
      chipActiveBorder: p.border,
      chipBorder: p.separator,
      dangerColor: p.destructive,
      successColor: p.success,
      actionBg: p.accent,
      actionText: p.onAccent,
      pressedBg: p.pressed,
      separator: p.separator,
      placeholder: p.textTertiary,
      isDark,
    }),
    [isDark, p, roomy],
  );
}
