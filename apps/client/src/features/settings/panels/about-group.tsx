import { toTailwind } from "@/styles/to-tailwind";
import type { ReactNode } from "react";
import { HAIRLINE_WIDTH } from '@/constants/layout';
import { useSettingsMetrics, useSettingsPalette } from "@/components/settings-surface";
import { aboutStyles } from "../utils/about-styles";
/** Group header that survives the SettingsHeadingProvider suppression. */
export function AboutGroup({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <div className={toTailwind({
    gap: 8
  })}>
      <span className={toTailwind([aboutStyles.groupTitle, {
      color: p.textSecondary
    }])}>{title}</span>
      <div className={toTailwind({
      backgroundColor: p.card,
      borderRadius: m.cardRadius,
      borderWidth: HAIRLINE_WIDTH,
      borderColor: p.separator,
      overflow: 'hidden'
    })}>
        {children}
      </div>
    </div>;
}
