import { memo, useState, type ComponentType, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Fonts } from '@/constants/theme';
import { useSettingsMetrics } from './metrics';
import { useSettingsPalette } from './palette';

type Icon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export const SettingsIconTile = memo(function SettingsIconTile({ icon: IconComponent, tone = 'default' }: { icon: Icon; tone?: 'default' | 'destructive' }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <View style={{ width: m.tileSize, height: m.tileSize, borderRadius: m.tileRadius, backgroundColor: p.tile, alignItems: 'center', justifyContent: 'center' }}>
    <IconComponent size={m.tileIcon} color={tone === 'destructive' ? p.destructive : p.textSecondary} strokeWidth={1.8} />
  </View>;
});

export function SettingsRow({ icon, label, description, right, onPress, isLast, tone, accessibilityLabel }: {
  icon?: Icon; label: string; description?: string; right?: ReactNode; onPress?: () => void;
  isLast?: boolean; tone?: 'default' | 'destructive'; accessibilityLabel?: string;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const [hovered, setHovered] = useState(false);
  const body = <View style={{ flexDirection: 'row', alignItems: 'center', gap: m.rowMinHeight > 40 ? 12 : 8, paddingHorizontal: m.gutter, paddingVertical: m.rowPaddingV, minHeight: m.rowMinHeight, backgroundColor: hovered ? 'rgba(255,255,255,0.03)' : undefined }} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
    {icon ? <SettingsIconTile icon={icon} tone={tone} /> : null}
    <View style={{ flex: 1, gap: 2 }}><Text style={{ fontSize: m.labelSize, fontFamily: Fonts.sans, color: tone === 'destructive' ? p.destructive : p.text }}>{label}</Text>
      {description ? <Text style={{ fontSize: m.descSize, fontFamily: Fonts.sans, color: p.textTertiary, lineHeight: m.descSize * 1.35 }}>{description}</Text> : null}</View>
    {right}
  </View>;
  const inset = icon ? m.gutter + m.tileSize + (m.rowMinHeight > 40 ? 12 : 8) : m.gutter;
  return <View>{onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} style={({ pressed }) => pressed ? { backgroundColor: p.pressed } : undefined}>{body}</Pressable> : body}{!isLast ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: p.separator, marginLeft: inset }} /> : null}</View>;
}

export function SettingsSwitch({ value, onValueChange, accessibilityLabel }: { value: boolean; onValueChange: (value: boolean) => void; accessibilityLabel?: string }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const control = <Switch value={value} onValueChange={onValueChange} accessibilityLabel={accessibilityLabel} trackColor={{ false: p.isDark ? '#3A3A3C' : '#E4E4E7', true: p.success }} thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined} />;
  return m.switchScale === 1 ? control : <View style={{ transform: [{ scale: m.switchScale }] }}>{control}</View>;
}
