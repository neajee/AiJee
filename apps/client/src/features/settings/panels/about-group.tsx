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
  return <div className={"flex flex-col gap-[8px]"}>
      <span>{title}</span>
      <div className={"rounded-[var(--card-radius)] border-0 overflow-hidden"}>
        {children}
      </div>
    </div>;
}
