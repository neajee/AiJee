import { type ReactNode } from 'react';
import { useSettingsPalette } from '@/components/settings-surface';
export function SettingsScroll({
  children
}: {
  children: ReactNode;
}) {
  const palette = useSettingsPalette();
  return <div className="min-h-full bg-background">
      <div className="flex flex-col gap-[var(--group-gap)] px-[var(--gutter)] pt-[calc(var(--gutter)/2)] pb-[calc(var(--bottom-inset)+32px)] w-full max-w-[var(--content-max-width)] self-center">
        {children}
      </div>
    </div>;
}
