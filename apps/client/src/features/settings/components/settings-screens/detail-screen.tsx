import { toTailwind } from "@/styles/to-tailwind";
import { type ReactNode } from 'react';
import { useSafeAreaInsets } from "@/platform/browser";
import { ChevronLeft } from 'lucide-react';
import { SettingsHeadingProvider, SettingsLayoutProvider, useSettingsContentStyle, useSettingsMetrics, useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import { type SettingsSection } from '../../sections';
import { SettingsScroll } from './settings-scroll';
import { desktopStyles, styles } from './style-tokens';
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
  return <div className={toTailwind(desktopStyles.detail)}>
      <div className={toTailwind([desktopStyles.detailHeader, {
      borderBottomColor: palette.separator,
      paddingLeft: inset,
      paddingRight: inset
    }])}>
        <div className={toTailwind(desktopStyles.detailHeaderCopy)}>
          <span className={toTailwind([desktopStyles.detailTitle, {
          color: palette.text
        }])}>{section.title}</span>
        </div>
      </div>
      <div className={toTailwind(desktopStyles.detailScroll)}>
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
  return <div className={toTailwind([styles.screen, {
    backgroundColor: palette.bg
  }])}>
      <div className={toTailwind([styles.navBar, {
      borderBottomColor: palette.separator
    }])}>
        <div className={toTailwind([styles.navBarInner, {
        paddingLeft: metrics.gutter - 6,
        paddingRight: metrics.gutter - 6,
        maxWidth: metrics.contentMaxWidth,
        minHeight: metrics.rowMinHeight + 4
      }])}>
          <button onClick={onBack} role="button" aria-label="返回设置" hitSlop={8}>
            <ChevronLeft size={metrics.chevronSize + 6} color={palette.text} strokeWidth={2} />
          </button>
          <span className={toTailwind([styles.navTitle, {
          fontSize: metrics.labelSize + 1,
          color: palette.text
        }])}>{title}</span>
        </div>
      </div>
      <div className={toTailwind(styles.scroll)}>{children}</div>
    </div>;
}
