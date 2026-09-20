import { type ReactNode } from 'react';
import { useSafeAreaInsets } from "@/platform/browser";
import { ChevronLeft } from 'lucide-react';
import { SettingsHeadingProvider, SettingsLayoutProvider, useSettingsContentStyle, useSettingsMetrics, useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
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
  const inset = metrics.gutter + 6;
  return <div className={""}>
      <div className={"" + " " + "pl-[0] pr-[0]"}>
        <div className={""}>
          <span className={"" + " " + ""}>{section.title}</span>
        </div>
      </div>
      <div className={""}>
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
  const insets = useSafeAreaInsets();
  const metrics = useSettingsMetrics();
  const palette = useSettingsPalette();
  const contentStyle = useSettingsContentStyle(insets.bottom);
  return <div className={"" + " " + ""}>
      <div className={"" + " " + ""}>
        <div className={"" + " " + "pl-[0] pr-[0] max-w-[contentMaxWidth] min-h-[0]"}>
          <button onClick={onBack} role="button" aria-label="返回设置" hitSlop={8}>
            <ChevronLeft size={metrics.chevronSize + 6} color={palette.text} strokeWidth={2} />
          </button>
          <span className={"" + " " + "text-[0]"}>{title}</span>
        </div>
      </div>
      <div className={""}>{children}</div>
    </div>;
}
