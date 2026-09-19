import { toTailwind } from "@/styles/to-tailwind";
import { memo, useState, type ComponentType, type ReactNode } from 'react';
import { Fonts } from '@/constants/theme';
import { useSettingsMetrics } from './metrics';
import { useSettingsPalette } from './palette';
type Icon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;
export const SettingsIconTile = memo(function SettingsIconTile({
  icon: IconComponent,
  tone = 'default'
}: {
  icon: Icon;
  tone?: 'default' | 'destructive';
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <div width={m.tileSize} height={m.tileSize} borderRadius={m.tileRadius === 8 ? '$2' : 5} className={toTailwind({
    backgroundColor: p.tile,
    alignItems: 'center',
    justifyContent: 'center'
  })}>
    <IconComponent size={m.tileIcon} color={tone === 'destructive' ? p.destructive : p.textSecondary} strokeWidth={1.8} />
  </div>;
});
export function SettingsRow({
  icon,
  label,
  description,
  right,
  onPress,
  isLast,
  tone,
  accessibilityLabel
}: {
  icon?: Icon;
  label: string;
  description?: string;
  right?: ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  tone?: 'default' | 'destructive';
  accessibilityLabel?: string;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const [hovered, setHovered] = useState(false);
  const body = <div flexDirection="row" alignItems="center" gap={m.rowMinHeight > 40 ? '$3' : '$2'} className={toTailwind({
    paddingLeft: m.gutter,
    paddingRight: m.gutter,
    paddingTop: m.rowPaddingV,
    paddingBottom: m.rowPaddingV,
    minHeight: m.rowMinHeight,
    backgroundColor: hovered ? 'rgba(255,255,255,0.03)' : undefined
  })} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
    {icon ? <SettingsIconTile icon={icon} tone={tone} /> : null}
    <div className={toTailwind({
      flex: 1,
      gap: 2,
      alignSelf: 'stretch',
      justifyContent: 'center'
    })}><span className={toTailwind({
        fontSize: m.labelSize,
        fontFamily: Fonts.sans,
        color: tone === 'destructive' ? p.destructive : p.text,
        textAlign: 'left'
      })}>{label}</span>
      {description ? <span className={toTailwind({
        fontSize: m.descSize,
        fontFamily: Fonts.sans,
        color: p.textTertiary,
        lineHeight: m.descSize * 1.35,
        textAlign: 'left'
      })}>{description}</span> : null}</div>
    {right}
  </div>;
  const inset = icon ? m.gutter + m.tileSize + (m.rowMinHeight > 40 ? 12 : 8) : m.gutter;
  return <div>{onPress ? <button onClick={onPress} role="button" aria-label={accessibilityLabel ?? label}>{body}</button> : body}{!isLast ? <div className={toTailwind({
      height: 0.5,
      backgroundColor: p.separator,
      marginLeft: inset
    })} /> : null}</div>;
}
export function SettingsSwitch({
  value,
  onValueChange,
  accessibilityLabel
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const control = <input value={value} onValueChange={onValueChange} aria-label={accessibilityLabel} trackColor={{
    false: p.isDark ? '#3A3A3C' : '#E4E4E7',
    true: p.success
  }} thumbColor={false ? '#FFFFFF' : undefined} />;
  return m.switchScale === 1 ? control : <div className={toTailwind({
    transform: [{
      scale: m.switchScale
    }]
  })}>{control}</div>;
}
