import { createFileRoute } from "@tanstack/react-router";
import { useSafeAreaInsets } from "@/platform/browser";
import { Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useServersStore } from "@/features/servers/store";
import { ServersSection } from "@/features/servers/components/servers-section";
import { useSettingsPalette } from "@/components/settings-surface";

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
  const empty = useServersStore(s => s.servers.length === 0);
  return <div className={"" + " " + ""} edges={["top", "left", "right"]}>
      {empty ? <ServersSection isDark={isDark} variant="onboarding" /> : <div className={""}>
          <div className={""}>
            {/* This route can render outside the app shell, so it carries its
                own title instead of relying on a header bar. */}
            <span className={"" + " " + ""}>连接</span>
            <span className={"" + " " + ""}>
              选择要连接的 AiJee 电脑。
            </span>
            <ServersSection isDark={isDark} />
          </div>
        </div>}
    </div>;
}
const styles = {
  safeArea: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  content: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 20
  },
  inner: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center"
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: Fonts.sansMedium
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.sans,
    marginTop: 2,
    marginBottom: 20
  }
} as const;
export const Route = createFileRoute("/_app/servers")({
  component: ServersScreen
});
