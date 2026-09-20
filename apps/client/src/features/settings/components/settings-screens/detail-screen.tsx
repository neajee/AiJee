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
        </SettingsDetailChrome> : <SettingsScroll>
          <SettingsDesktopSection section={section} isDark={isDark} />
        </SettingsScroll>}
    </SettingsLayoutProvider>;
}
function SettingsDesktopSection({
  section,
  isDark
}: {
  section: SettingsSection;
  isDark: boolean;
}) {
  const metrics = useSettingsMetrics();
  const palette = useSettingsPalette();
  const Component = section.Component;
  return <div className="flex flex-col gap-[var(--group-gap)] w-full max-w-[var(--content-max-width)] self-center">
      <div className="px-[var(--gutter)]">
        <div className="flex flex-col gap-2">
          <span className="text-[var(--title-size)] text-foreground">{section.title}</span>
        </div>
      </div>
      <div className="flex flex-col gap-[var(--group-gap)]">
        <SettingsHeadingProvider visible={false}>
          <Component isDark={isDark} />
        </SettingsHeadingProvider>
      </div>
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
  return <div className="min-h-full bg-background">
      <div className="flex flex-col gap-2 px-[var(--gutter)] pt-[calc(var(--gutter)/2)]">
        <div className="flex items-center gap-2 max-w-[var(--content-max-width)] min-h-0">
          <button onClick={onBack} role="button" aria-label="返回设置">
            <ChevronLeft size={metrics.chevronSize + 6} color={palette.text} strokeWidth={2} />
          </button>
          <span className="text-[var(--title-size)] text-foreground">{title}</span>
        </div>
      </div>
      <div className="flex flex-col gap-[var(--group-gap)] px-[var(--gutter)] pb-[calc(var(--bottom-inset)+32px)]">{children}</div>
    </div>;
}
