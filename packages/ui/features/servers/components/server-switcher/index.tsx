import { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Check, ChevronDown, Settings } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PiLogo } from "@/components/pi-logo";
import { useAuthStore } from "@/features/auth/store";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useServersStore, type Server } from "../../store";

/**
 * Which server the projects below belong to, and how to switch it.
 *
 * This sits at the top of the project sidebar rather than in the window bar:
 * it scopes everything in the sidebar, so it belongs to the sidebar. The window
 * bar only keeps window-level controls.
 */
export function ServerSwitcher() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const activeServerId = useAuthStore((s) => s.activeServerId);
  const activateServer = useAuthStore((s) => s.activateServer);
  const servers = useServersStore((s) => s.servers);
  const activeServer = servers.find((s) => s.id === activeServerId);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const switchServer = useWorkspaceStore((s) => s.switchServer);

  useEffect(() => {
    if (!popoverVisible || Platform.OS !== "web") return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-server-popover]")) {
        setPopoverVisible(false);
      }
    };
    const id = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", handler);
    };
  }, [popoverVisible]);

  const handleSwitchServer = useCallback(
    async (server: Server) => {
      if (server.id === activeServerId) {
        setPopoverVisible(false);
        return;
      }
      setSwitchingId(server.id);
      await switchServer(server.id);
      const ok = await activateServer(server);
      if (ok) {
        await fetchWorkspaces(server.id);
        const { workspaces, selectedWorkspaceId } = useWorkspaceStore.getState();
        const targetId = selectedWorkspaceId ?? workspaces[0]?.id;
        if (targetId) {
          router.replace(`/workspace/${targetId}`);
        }
      }
      setSwitchingId(null);
      setPopoverVisible(false);
    },
    [activeServerId, activateServer, switchServer, fetchWorkspaces, router],
  );

  const textPrimary = isDark ? "#fefdfd" : colors.text;
  const textMuted = isDark ? "#cdc8c5" : colors.textTertiary;
  const popoverBg = isDark ? "#252525" : "#FFFFFF";
  const borderColor = isDark ? "#3b3a39" : "rgba(0,0,0,0.12)";
  const hoverBg = isDark ? "#333" : "#F5F5F5";

  return (
    <View style={styles.root} {...({ "data-server-popover": true } as any)}>
      <Pressable
        onPress={() => setPopoverVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Switch server"
        style={({ pressed, hovered }: any) => [
          styles.trigger,
          (pressed || hovered) && {
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          },
        ]}
      >
        <View
          style={[
            styles.serverIcon,
            { backgroundColor: isDark ? "#fefdfd" : "#1a1a1a" },
          ]}
        >
          <PiLogo size={14} color={isDark ? "#1a1a1a" : "#fff"} />
        </View>
        <Text
          style={[styles.serverName, { color: textPrimary }]}
          numberOfLines={1}
        >
          {activeServer?.name ?? "No Server"}
        </Text>
        <ChevronDown size={12} color={textMuted} strokeWidth={2} />
      </Pressable>

      {popoverVisible && (
        <View
          style={[styles.popover, { backgroundColor: popoverBg, borderColor }]}
        >
          <View style={styles.popoverHeader}>
            <Text style={[styles.popoverTitle, { color: textMuted }]}>
              Servers
            </Text>
          </View>
          <ScrollView style={styles.popoverList} bounces={false}>
            {servers.map((server) => {
              const isActive = server.id === activeServerId;
              const isSwitching = server.id === switchingId;
              return (
                <Pressable
                  key={server.id}
                  onPress={() => handleSwitchServer(server)}
                  disabled={isSwitching}
                  style={({ pressed, hovered }: any) => [
                    styles.popoverItem,
                    isActive && {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                    },
                    (pressed || hovered) && { backgroundColor: hoverBg },
                  ]}
                >
                  <View
                    style={[
                      styles.popoverItemIcon,
                      { backgroundColor: isDark ? "#fefdfd" : "#1a1a1a" },
                    ]}
                  >
                    <PiLogo size={10} color={isDark ? "#1a1a1a" : "#fff"} />
                  </View>
                  <View style={styles.popoverItemInfo}>
                    <Text
                      style={[styles.popoverItemName, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {server.name}
                    </Text>
                    <Text
                      style={[styles.popoverItemAddress, { color: textMuted }]}
                      numberOfLines={1}
                    >
                      {server.address}
                    </Text>
                  </View>
                  {isActive && <Check size={14} color="#34C759" strokeWidth={2.5} />}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={[styles.popoverFooter, { borderTopColor: borderColor }]}>
            <Pressable
              onPress={() => {
                setPopoverVisible(false);
                router.push("/settings/servers");
              }}
              style={({ pressed, hovered }: any) => [
                styles.popoverFooterBtn,
                (pressed || hovered) && { backgroundColor: hoverBg },
              ]}
            >
              <Settings size={13} color={textMuted} strokeWidth={1.8} />
              <Text style={[styles.popoverFooterText, { color: textMuted }]}>
                管理服务器
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  serverIcon: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  serverName: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  popover: {
    position: "absolute",
    top: 34,
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: 0.633,
    zIndex: 1000,
    boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.15)",
    elevation: 12,
    overflow: "hidden",
  } as any,
  popoverHeader: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  popoverTitle: {
    fontSize: 11,
    fontFamily: Fonts.sansSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  popoverList: {
    maxHeight: 240,
  },
  popoverItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  popoverItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  popoverItemInfo: {
    flex: 1,
  },
  popoverItemName: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  popoverItemAddress: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    marginTop: 1,
  },
  popoverFooter: {
    borderTopWidth: 0.633,
    paddingVertical: 4,
  },
  popoverFooterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  popoverFooterText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
});
