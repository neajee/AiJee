import { Text, View } from "@/components/dom";
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
  return <View gap={m.rowMinHeight > 40 ? '$2' : 5}>
    {header && headingVisible ? <Text style={{ fontSize: m.headerSize, fontFamily: Fonts.sansMedium, color: p.textSecondary, paddingLeft: m.headerInset, paddingRight: m.headerInset, textAlign: 'left' }}>{header}</Text> : null}
    <View borderRadius={m.cardRadius === 12 ? '$3' : 7} style={{ backgroundColor: p.card, borderWidth: 0.5, borderColor: p.separator, overflow: 'hidden' }}>{children}</View>
    {footer ? <Text style={{ fontSize: m.descSize, fontFamily: Fonts.sans, color: p.textTertiary, paddingLeft: m.headerInset, paddingRight: m.headerInset, textAlign: 'left' }}>{footer}</Text> : null}
  </View>;
}
