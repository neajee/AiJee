import { Text as TamaguiText, View as TamaguiView } from 'tamagui';
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
  return <TamaguiView gap={m.rowMinHeight > 40 ? '$2' : 5}>
    {header && headingVisible ? <TamaguiText style={{ fontSize: m.headerSize, fontFamily: Fonts.sansMedium, color: p.textSecondary, paddingLeft: m.headerInset, paddingRight: m.headerInset, textAlign: 'left' }}>{header}</TamaguiText> : null}
    <TamaguiView borderRadius={m.cardRadius === 12 ? '$3' : 7} style={{ backgroundColor: p.card, borderWidth: 0.5, borderColor: p.separator, overflow: 'hidden' }}>{children}</TamaguiView>
    {footer ? <TamaguiText style={{ fontSize: m.descSize, fontFamily: Fonts.sans, color: p.textTertiary, paddingLeft: m.headerInset, paddingRight: m.headerInset, textAlign: 'left' }}>{footer}</TamaguiText> : null}
  </TamaguiView>;
}
