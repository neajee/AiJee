import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useServersStore } from "@/features/servers/store";
import { ServersSection } from "@/features/servers/components/servers-section";
import { useSettingsPalette } from "@/features/settings/components/settings-list";

/**
 * The standalone connections screen.
 *
 * Server management lives in Settings → 连接; this route stays because it is the
 * only surface reachable before a connection exists (first run) or after one
 * breaks (offline recovery), when the app shell cannot mount. It renders the
 * same section as settings, so the two can't drift apart.
 */
export default function ServersScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const p = useSettingsPalette();
  const empty = useServersStore((s) => s.servers.length === 0);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: p.bg }]}
      edges={["top", "left", "right"]}
    >
      {empty ? (
        <ServersSection isDark={isDark} variant="onboarding" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            {/* This route can render outside the app shell, so it carries its
                own title instead of relying on a header bar. */}
            <Text style={[styles.title, { color: p.text }]}>连接</Text>
            <Text style={[styles.subtitle, { color: p.textTertiary }]}>
              选择要连接的 PiDeck 电脑。
            </Text>
            <ServersSection isDark={isDark} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inner: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: Fonts.sansMedium,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.sans,
    marginTop: 2,
    marginBottom: 20,
  },
});
