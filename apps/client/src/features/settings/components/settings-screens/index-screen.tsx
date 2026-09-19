import { toTailwind } from "@/styles/to-tailwind";
import { Redirect } from '@/platform/router-adapter';
import { ChevronRight } from 'lucide-react';
import { SettingsGroup, SettingsLayoutProvider, SettingsRow, useSettingsMetrics, useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import { SETTINGS_SECTIONS, type SettingsSection } from '../../sections';
import { SettingsScroll } from './settings-scroll';
import { styles } from './style-tokens';
export function SettingsIndexScreen({
  onOpenSection
}: {
  isDark: boolean;
  onOpenSection: (section: SettingsSection) => void;
}) {
  const phone = useSettingsPhoneLayout();
  const metrics = useSettingsMetrics();
  const palette = useSettingsPalette();
  if (!phone) {
    const first = SETTINGS_SECTIONS[0];
    return first ? <Redirect href={`/settings/${first.slug}`} /> : null;
  }
  return <SettingsLayoutProvider phone={phone}>
      <SettingsScroll>
        <span className={toTailwind([styles.title, {
        fontSize: metrics.titleSize,
        color: palette.text,
        paddingTop: metrics.gutter / 2,
        paddingBottom: metrics.gutter / 2
      }])}>设置</span>
        <SettingsGroup>
          {SETTINGS_SECTIONS.map((section, index) => {
          const isLast = index === SETTINGS_SECTIONS.length - 1;
          if (section.Row) {
            const InlineRow = section.Row;
            return <InlineRow key={section.slug} isLast={isLast} />;
          }
          return <SettingsRow key={section.slug} icon={section.icon} label={section.title} description={section.summary} isLast={isLast} onClick={() => onOpenSection(section)} right={<ChevronRight size={metrics.chevronSize} color={palette.textTertiary} strokeWidth={2} />} />;
        })}
        </SettingsGroup>
      </SettingsScroll>
    </SettingsLayoutProvider>;
}
