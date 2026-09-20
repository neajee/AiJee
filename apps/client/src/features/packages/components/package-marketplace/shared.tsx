import { ShieldAlert } from 'lucide-react';
import { Fonts } from '@/constants/theme';
import { useSettingsMetrics, useSettingsPalette } from '@/components/settings-surface';
export function Notice({
  text,
  tone
}: {
  text: string;
  tone: 'warning' | 'error';
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const color = tone === 'error' ? p.destructive : p.isDark ? '#D29922' : '#9A6700';
  const background = tone === 'error' ? p.isDark ? 'rgba(248,81,73,0.14)' : 'rgba(207,34,46,0.10)' : p.isDark ? 'rgba(210,153,34,0.14)' : 'rgba(154,103,0,0.10)';
  return <div className={"  rounded-[var(--tile-radius)]"}>
      <ShieldAlert size={13} color={color} strokeWidth={2} />
      <span className={"flex-1 text-[var(--desc-size)] leading-[0]"}>
        {text}
      </span>
    </div>;
}
export function PrimaryButton({
  label,
  icon: Icon,
  busy,
  onPress
}: {
  label: string;
  icon?: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  busy?: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <button onClick={onPress} disabled={busy} role="button" aria-label={label} className={"block"}>
      {busy ? <span size="small" color={p.onAccent} /> : <>
          {Icon ? <Icon size={13} color={p.onAccent} strokeWidth={2.2} /> : null}
          <span className={"text-[var(--desc-size)] font-sans"}>
            {label}
          </span>
        </>}
    </button>;
}
export function SecondaryButton({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <button onClick={onPress} role="button" aria-label={label} className={"block"}>
      <span className={"text-[var(--desc-size)] font-sans"}>
        {label}
      </span>
    </button>;
}
