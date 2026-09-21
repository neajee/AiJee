import { Redirect } from '@/hooks/router';
import { ChevronRight } from 'lucide-react';
import { SettingsGroup, SettingsLayoutProvider, SettingsRow, useSettingsMetrics, useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import { SETTINGS_SECTIONS, type SettingsSection } from '../../sections';
import { SettingsScroll } from './settings-scroll';
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
        <div className="flex items-end justify-between"><span className="font-sans text-xl font-semibold tracking-tight text-foreground">设置</span><span className="text-xs text-text-secondary">偏好设置</span></div>
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
