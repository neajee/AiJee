import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { Fonts } from '@/constants/theme';
import { useSettingsHeadingVisible } from './contexts';
import { useSettingsMetrics } from './metrics';
import { useSettingsPalette } from './palette';

export function SettingsGroup({ header, footer, children }: {
  header?: string;
  footer?: string;
  children: ReactNode;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const headingVisible = useSettingsHeadingVisible();
  return <View style={{ gap: m.rowMinHeight > 40 ? 8 : 5 }}>
    {header && headingVisible ? <Text style={{ fontSize: m.headerSize, fontFamily: Fonts.sansMedium, color: p.textSecondary, paddingHorizontal: m.headerInset }}>{header}</Text> : null}
    <View style={{ backgroundColor: p.card, borderRadius: m.cardRadius, borderWidth: StyleSheet.hairlineWidth, borderColor: p.separator, overflow: 'hidden' }}>{children}</View>
    {footer ? <Text style={{ fontSize: m.descSize, fontFamily: Fonts.sans, color: p.textTertiary, paddingHorizontal: m.headerInset }}>{footer}</Text> : null}
  </View>;
}
