import type { ReactNode } from 'react';
import { Fonts } from '@/constants/theme';
import { useSettingsHeadingVisible } from './contexts';
import { useSettingsMetrics } from './metrics';
import { useSettingsPalette } from './palette';
export function SettingsGroup({
  header,
  footer,
  children
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const headingVisible = useSettingsHeadingVisible();
  return <div className="flex flex-col gap-[var(--group-gap)]">
    {header && headingVisible ? <span className={"text-[var(--header-size)] font-sans pl-[var(--header-inset)] pr-[var(--header-inset)] text-left"}>{header}</span> : null}
    <div className="rounded-[var(--card-radius)] border border-border overflow-hidden">{children}</div>
    {footer ? <span className={"text-[var(--desc-size)] font-sans pl-[var(--header-inset)] pr-[var(--header-inset)] text-left"}>{footer}</span> : null}
  </div>;
}
