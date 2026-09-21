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
function ServersScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const p = useSettingsPalette();
  const empty = useServersStore(s => s.servers.length === 0);
  return <div className={"  bg-background"}>
      {empty ? <ServersSection isDark={isDark} variant="onboarding" /> : <div className="flex flex-col">
          <div className="flex flex-col">
            {/* This route can render outside the app shell, so it carries its
                own title instead of relying on a header bar. */}
            <span className={"  text-foreground"}>连接</span>
            <span className={"  text-text-tertiary"}>
              选择要连接的 AiJee 电脑。
            </span>
            <ServersSection isDark={isDark} />
          </div>
        </div>}
    </div>;
}export const Route = createFileRoute("/_app/servers")({
  component: ServersScreen
});
