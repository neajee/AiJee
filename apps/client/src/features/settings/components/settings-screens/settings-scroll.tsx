import { type ReactNode } from 'react';
export function SettingsScroll({
  children
}: {
  children: ReactNode;
}) {
  return <div className="h-full min-h-0 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-[var(--gutter)] pb-[calc(var(--bottom-inset)+32px)] pt-5">
        {children}
      </div>
    </div>;
}
