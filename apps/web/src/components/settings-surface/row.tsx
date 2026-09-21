import { memo, type ComponentType, type ReactNode } from 'react';
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
  return <div className="flex h-[var(--tile-size)] w-[var(--tile-size)] items-center justify-center rounded-[var(--tile-radius)] bg-surface-raised">
    <IconComponent size={m.tileIcon} color={tone === 'destructive' ? p.destructive : p.textSecondary} strokeWidth={1.8} />
  </div>;
});
export function SettingsRow({
  icon,
  label,
  description,
  right,
  onClick,
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
  const body = <div className="flex min-h-[var(--row-min-height)] items-center gap-[var(--row-gap)] px-[var(--gutter)] py-[var(--row-padding-v)]">
    {icon ? <SettingsIconTile icon={icon} tone={tone} /> : null}
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
      <span className="truncate text-left font-sans text-[var(--label-size)] text-foreground">{label}</span>
      {description ? <span className="truncate text-left font-sans text-[var(--desc-size)] text-text-secondary">{description}</span> : null}
    </div>
    {right}
  </div>;
  return <div>{onClick ? <button className="w-full text-left hover:bg-hover" onClick={onClick} role="button" aria-label={accessibilityLabel ?? label}>{body}</button> : body}</div>;
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
  return <button
    type="button"
    role="switch"
    aria-checked={value}
    aria-label={accessibilityLabel}
    onClick={() => onValueChange(!value)}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${value ? 'border-primary bg-primary' : 'border-border bg-surface-raised'}`}
  >
    <span className={`size-3.5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-[17px]' : 'translate-x-[2px]'}`} />
  </button>;
}
