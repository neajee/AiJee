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
  return <div className={"gap-[8px]"}>
      <span className={"" + " " + ""}>{title}</span>
      <div className={"rounded-[cardRadius] border-[0] overflow-hidden"}>
        {children}
      </div>
    </div>;
}
