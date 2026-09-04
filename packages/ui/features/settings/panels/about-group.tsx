import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSettingsMetrics, useSettingsPalette } from "@/components/settings-surface";
import { aboutStyles } from "../utils/about-styles";
/** Group header that survives the SettingsHeadingProvider suppression. */
export function AboutGroup({ title, children }: { title: string; children: ReactNode }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[aboutStyles.groupTitle, { color: p.textSecondary }]}>{title}</Text>
      <View
        style={{
          backgroundColor: p.card,
          borderRadius: m.cardRadius,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: p.separator,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}
