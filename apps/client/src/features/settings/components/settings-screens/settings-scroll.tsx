import { toTailwind } from "@/styles/to-tailwind";
import { type ReactNode } from 'react';
import { useSafeAreaInsets } from "@/platform/browser";
import { useSettingsContentStyle, useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import { styles } from './style-tokens';
export function SettingsScroll({
  children
}: {
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const palette = useSettingsPalette();
  const phone = useSettingsPhoneLayout();
  const contentStyle = useSettingsContentStyle(insets.bottom);
  return <div className={toTailwind([styles.screen, {
    backgroundColor: palette.bg
  }])}>
      <div className={toTailwind(styles.scroll)}>
        {children}
      </div>
    </div>;
}
