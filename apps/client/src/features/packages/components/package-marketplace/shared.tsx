import { ShieldAlert } from 'lucide-react';
import type { ComponentType } from 'react';
import { useSettingsPalette } from '@/components/settings-surface';

export function Notice({
  text,
  tone
}: {
  text: string;
  tone: 'warning' | 'error';
}) {
  const p = useSettingsPalette();
  const color = tone === 'error' ? p.destructive : p.isDark ? '#D29922' : '#9A6700';
  const background = tone === 'error' ? p.isDark ? 'rgba(248,81,73,0.14)' : 'rgba(207,34,46,0.10)' : p.isDark ? 'rgba(210,153,34,0.14)' : 'rgba(154,103,0,0.10)';
  return <div className="flex items-start gap-[7px] rounded-[var(--tile-radius)] px-2.5 py-2" style={{
    backgroundColor: background
  }}>
      <ShieldAlert className="mt-px shrink-0" size={13} color={color} strokeWidth={2} />
      <span className="flex-1 font-sans text-[var(--desc-size)] leading-[1.45]" style={{
      color
    }}>
        {text}
      </span>
    </div>;
}
export function PrimaryButton({
  label,
  icon: Icon,
  busy,
  onClick
}: {
  label: string;
  icon?: ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  busy?: boolean;
  onClick: () => void;
}) {
  const p = useSettingsPalette();
  return <button onClick={onClick} disabled={busy} role="button" aria-label={label} className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-[var(--tile-radius)] border border-primary bg-primary px-3.5 text-accent-content transition-opacity hover:opacity-90 active:opacity-60 disabled:opacity-60">
      {busy ? <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-accent-content/40 border-t-accent-content" /> : <>
          {Icon ? <Icon size={13} color={p.onAccent} strokeWidth={2.2} /> : null}
          <span className="font-sans text-[var(--desc-size)] font-medium">
            {label}
          </span>
        </>}
    </button>;
}
export function SecondaryButton({
  label,
  onClick
}: {
  label: string;
  onClick: () => void;
}) {
  return <button onClick={onClick} role="button" aria-label={label} className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-[var(--tile-radius)] border border-border px-3.5 text-foreground transition-colors hover:bg-hover active:opacity-60">
      <span className="font-sans text-[var(--desc-size)] font-medium">
        {label}
      </span>
    </button>;
}
