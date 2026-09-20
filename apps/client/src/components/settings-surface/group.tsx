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
  return <div gap={m.rowMinHeight > 40 ? '$2' : 5}>
    {header && headingVisible ? <span className={"text-[headerSize] font-sans pl-[headerInset] pr-[headerInset] text-left"}>{header}</span> : null}
    <div borderRadius={m.cardRadius === 12 ? '$3' : 7} className={"border-[0.5px] overflow-hidden"}>{children}</div>
    {footer ? <span className={"text-[descSize] font-sans pl-[headerInset] pr-[headerInset] text-left"}>{footer}</span> : null}
  </div>;
}
