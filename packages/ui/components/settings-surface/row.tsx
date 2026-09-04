import { memo, useState, type ComponentType, type ReactNode } from 'react';
import { Platform, Pressable, Switch } from 'react-native';
import { Text as TamaguiText, View as TamaguiView } from 'tamagui';
import { Fonts } from '@/constants/theme';
import { useSettingsMetrics } from './metrics';
import { useSettingsPalette } from './palette';

type Icon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export const SettingsIconTile = memo(function SettingsIconTile({ icon: IconComponent, tone = 'default' }: { icon: Icon; tone?: 'default' | 'destructive' }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <TamaguiView width={m.tileSize} height={m.tileSize} borderRadius={m.tileRadius === 8 ? '$2' : 5} style={{ backgroundColor: p.tile, alignItems: 'center', justifyContent: 'center' }}>
    <IconComponent size={m.tileIcon} color={tone === 'destructive' ? p.destructive : p.textSecondary} strokeWidth={1.8} />
  </TamaguiView>;
});

export function SettingsRow({ icon, label, description, right, onPress, isLast, tone, accessibilityLabel }: {
  icon?: Icon; label: string; description?: string; right?: ReactNode; onPress?: () => void;
  isLast?: boolean; tone?: 'default' | 'destructive'; accessibilityLabel?: string;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const [hovered, setHovered] = useState(false);
  const body = <TamaguiView flexDirection="row" alignItems="center" gap={m.rowMinHeight > 40 ? '$3' : '$2'} style={{ paddingLeft: m.gutter, paddingRight: m.gutter, paddingTop: m.rowPaddingV, paddingBottom: m.rowPaddingV, minHeight: m.rowMinHeight, backgroundColor: hovered ? 'rgba(255,255,255,0.03)' : undefined }} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
    {icon ? <SettingsIconTile icon={icon} tone={tone} /> : null}
    <TamaguiView style={{ flex: 1, gap: 2, alignSelf: 'stretch', justifyContent: 'center' }}><TamaguiText style={{ fontSize: m.labelSize, fontFamily: Fonts.sans, color: tone === 'destructive' ? p.destructive : p.text, textAlign: 'left' }}>{label}</TamaguiText>
      {description ? <TamaguiText style={{ fontSize: m.descSize, fontFamily: Fonts.sans, color: p.textTertiary, lineHeight: m.descSize * 1.35, textAlign: 'left' }}>{description}</TamaguiText> : null}</TamaguiView>
    {right}
  </TamaguiView>;
  const inset = icon ? m.gutter + m.tileSize + (m.rowMinHeight > 40 ? 12 : 8) : m.gutter;
  return <TamaguiView>{onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} style={({ pressed }) => pressed ? { backgroundColor: p.pressed } : undefined}>{body}</Pressable> : body}{!isLast ? <TamaguiView style={{ height: 0.5, backgroundColor: p.separator, marginLeft: inset }} /> : null}</TamaguiView>;
}

export function SettingsSwitch({ value, onValueChange, accessibilityLabel }: { value: boolean; onValueChange: (value: boolean) => void; accessibilityLabel?: string }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const control = <Switch value={value} onValueChange={onValueChange} accessibilityLabel={accessibilityLabel} trackColor={{ false: p.isDark ? '#3A3A3C' : '#E4E4E7', true: p.success }} thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined} />;
  return m.switchScale === 1 ? control : <TamaguiView style={{ transform: [{ scale: m.switchScale }] }}>{control}</TamaguiView>;
}
