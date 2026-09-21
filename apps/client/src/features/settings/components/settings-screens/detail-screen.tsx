import { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { SettingsHeadingProvider, SettingsLayoutProvider, useSettingsMetrics, useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import { type SettingsSection } from '../../sections';
import { SettingsScroll } from './settings-scroll';
export function SettingsDetailScreen({
  section,
  isDark,
  onBack
}: {
  section: SettingsSection;
  isDark: boolean;
  onBack: () => void;
}) {
  const phone = useSettingsPhoneLayout();
  const Component = section.Component;
  return <SettingsLayoutProvider phone={phone}>
      {phone ? <SettingsDetailChrome title={section.title} onBack={onBack}>
          <SettingsHeadingProvider visible={false}>
            <Component isDark={isDark} />
          </SettingsHeadingProvider>
        </SettingsDetailChrome> : <SettingsDesktopSection section={section} isDark={isDark} onBack={onBack} />}
    </SettingsLayoutProvider>;
}
function SettingsDesktopSection({
  section,
  isDark,
  onBack
}: {
  section: SettingsSection;
  isDark: boolean;
  onBack: () => void;
}) {
  const Component = section.Component;
  const metrics = useSettingsMetrics();
  const palette = useSettingsPalette();
  return <div className="flex h-full min-h-0 flex-col border-l border-border">
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3"><span className="text-xs font-semibold text-foreground">{section.title}</span></div>
      <div className="min-h-0 flex-1 overflow-hidden"><SettingsScroll><div className="flex flex-col gap-5"><SettingsHeadingProvider visible={false}><Component isDark={isDark} /></SettingsHeadingProvider></div></SettingsScroll></div>
    </div>;
}
function SettingsDetailChrome({
  title,
  onBack,
  children
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const metrics = useSettingsMetrics();
  const palette = useSettingsPalette();
  return <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
        <div className="mx-auto flex w-full max-w-[760px] items-center gap-2">
          <button onClick={onBack} role="button" aria-label="返回设置" className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-hover">
            <ChevronLeft size={metrics.chevronSize + 6} color={palette.text} strokeWidth={2} />
          </button>
          <span className="font-sans text-sm font-semibold text-foreground">{title}</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto"><div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-[var(--gutter)] pb-[calc(var(--bottom-inset)+32px)] pt-5">{children}</div></div>
    </div>;
}
