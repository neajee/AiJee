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
  return <div className="flex items-center justify-center w-[var(--tile-size)] h-[var(--tile-size)] rounded-[var(--tile-radius)]">
    <IconComponent size={m.tileIcon} color={tone === 'destructive' ? p.destructive : p.textSecondary} strokeWidth={1.8} />
  </div>;
});
export function SettingsRow({
  icon,
  label,
  description,
  right,
  onClick,
  isLast,
  tone,
  accessibilityLabel
}: {
  icon?: Icon;
  label: string;
  description?: string;
  right?: ReactNode;
  onClick?: () => void;
  isLast?: boolean;
  tone?: 'default' | 'destructive';
  accessibilityLabel?: string;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const [hovered, setHovered] = useState(false);
  const body = <div className="flex items-center gap-[var(--row-gap)] pl-[var(--gutter)] pr-[var(--gutter)] pt-[var(--row-padding-v)] pb-[var(--row-padding-v)] min-h-[var(--row-min-height)]" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
    {icon ? <SettingsIconTile icon={icon} tone={tone} /> : null}
    <div className={"flex-1 gap-[2px] self-stretch justify-center"}><span className={"text-[var(--label-size)] font-sans text-left"}>{label}</span>
      {description ? <span className={"text-[var(--desc-size)] font-sans leading-[0] text-left"}>{description}</span> : null}</div>
    {right}
  </div>;
  return <div>{onClick ? <button onClick={onClick} role="button" aria-label={accessibilityLabel ?? label}>{body}</button> : body}{!isLast ? <div className="h-px ml-[var(--gutter)] bg-border" /> : null}</div>;
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
  return <input type="checkbox" checked={value} onChange={event => onValueChange(event.target.checked)} aria-label={accessibilityLabel} className="size-4 accent-primary" />;
}
