import type { ReactNode } from 'react';
import { useSettingsHeadingVisible } from './contexts';
export function SettingsGroup({
  header,
  footer,
  children
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
}) {
  const headingVisible = useSettingsHeadingVisible();
  return <div className="flex flex-col gap-2.5">
    {header && headingVisible ? <span className={"text-[var(--header-size)] font-sans pl-[var(--header-inset)] pr-[var(--header-inset)] text-left"}>{header}</span> : null}
    <div className="overflow-hidden rounded-[var(--card-radius)]">{children}</div>
    {footer ? <span className={"text-[var(--desc-size)] font-sans pl-[var(--header-inset)] pr-[var(--header-inset)] text-left"}>{footer}</span> : null}
  </div>;
}
