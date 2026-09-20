import { type ReactNode } from 'react';
import { useSafeAreaInsets } from "@/platform/browser";
import { useSettingsContentStyle, useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
export function SettingsScroll({
  children
}: {
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const palette = useSettingsPalette();
  const phone = useSettingsPhoneLayout();
  const contentStyle = useSettingsContentStyle(insets.bottom);
  return <div className={"  bg-background"}>
      <div className={"block"}>
        {children}
      </div>
    </div>;
}
