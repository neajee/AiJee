import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Pencil, Plus, QrCode, Trash2 } from "lucide-react-native";

import { Fonts } from "@/constants/theme";
import { PiLogo } from "@/components/pi-logo";
import { useServersStore, type Server } from "@/features/servers/store";
import { useAuthStore } from "@/features/auth/store";
import { useWorkspaceStore } from "@/features/workspace/store";
import { QrScanner } from "@/features/servers/components/qr-scanner";
import { NewWorkspaceDialog } from "@/features/workspace/components/new-workspace-dialog";
import {
  SettingsGroup,
  SettingsRow,
  useSettingsMetrics,
  useSettingsPalette,
} from "@/features/settings/components/settings-list";
import { ServerFormModal, type ServerFormData } from "../server-form";

/**
 * Connection settings: the computers this app can talk to.
 *
 * This is the in-app home for server management — the standalone `/servers`
 * route stays as the pre-auth and offline-recovery entry point, and renders the
 * same pieces so both surfaces behave identically.
 */
export function ServersSection({
  isDark,
  variant = "settings",
}: {
  isDark: boolean;
  /**
   * `onboarding` adds the first-run welcome for the standalone `/servers`
   * screen; inside settings there is always a header above us instead.
   */
  variant?: "settings" | "onboarding";
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const router = useRouter();

  const { servers, loaded, load, addServer, updateServer, removeServer } =
    useServersStore();
  const loginToServer = useAuthStore((s) => s.loginToServer);
  const logoutFromServer = useAuthStore((s) => s.logoutFromServer);
  const activeServerId = useAuthStore((s) => s.activeServerId);

  const [formVisible, setFormVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | undefined>();
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [newWsVisible, setNewWsVisible] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const handleAdd = useCallback(() => {
    setEditingServer(undefined);
    setLoginError(null);
    setFormVisible(true);
  }, []);

  const handleEdit = useCallback((server: Server) => {
    setEditingServer(server);
    setLoginError(null);
    setFormVisible(true);
  }, []);

  const handleDelete = useCallback(
    (server: Server) => {
      const doDelete = () => {
        removeServer(server.id);
        logoutFromServer(server.id);
      };
      if (Platform.OS === "web") {
        if (window.confirm(`移除「${server.name}」？`)) doDelete();
      } else {
        Alert.alert("移除服务器", `移除「${server.name}」？`, [
          { text: "取消", style: "cancel" },
          { text: "移除", style: "destructive", onPress: doDelete },
        ]);
      }
    },
    [removeServer, logoutFromServer],
  );

  /**
   * A fresh connection may land on a server with no projects yet, in which case
   * creating one is the only useful next step.
   */
  const navigateAfterConnect = useCallback(async () => {
    const ws = useWorkspaceStore.getState();
    const serverId = useAuthStore.getState().activeServerId;
    await ws.switchServer(serverId);
    await ws.fetchWorkspaces(serverId);
    const { workspaces, selectedWorkspaceId } = useWorkspaceStore.getState();
    const targetId = selectedWorkspaceId ?? workspaces[0]?.id;
    if (targetId) {
      router.replace("/");
    } else {
      setNewWsVisible(true);
    }
  }, [router]);

  const handleConnect = useCallback(
    async (server: Server) => {
      if (server.id === activeServerId) return;
      try {
        const auth = useAuthStore.getState();
        setConnecting(server.id);

        const connected = auth.hasToken(server.id)
          ? await auth.activateServer(server)
          : false;

        if (connected) {
          await navigateAfterConnect();
        } else {
          // A stored token that no longer works is indistinguishable from none:
          // ask for credentials rather than failing silently.
          setEditingServer(server);
          setLoginError("登录已过期，请重新输入凭据。");
          setFormVisible(true);
        }
      } catch (e) {
        console.error("handleConnect error:", e);
        setLoginError("连接失败，请检查地址与网络。");
      } finally {
        setConnecting(null);
      }
    },
    [activeServerId, navigateAfterConnect],
  );

  const handleSave = useCallback(
    async (data: ServerFormData) => {
      setLoginLoading(true);
      setLoginError(null);

      const { username, password, ...serverData } = data;
      let server: Server;
      if (editingServer) {
        await updateServer(editingServer.id, serverData);
        server = { ...editingServer, ...serverData };
      } else {
        await addServer(serverData);
        const current = useServersStore.getState().servers;
        server = current[current.length - 1];
      }

      const result = await loginToServer(server, { username, password });
      setLoginLoading(false);

      if (result.success) {
        setFormVisible(false);
        await navigateAfterConnect();
      } else {
        setLoginError(result.error ?? "连接失败");
      }
    },
    [editingServer, addServer, updateServer, loginToServer, navigateAfterConnect],
  );

  const handleNewWsClose = useCallback(() => {
    setNewWsVisible(false);
    router.replace("/");
  }, [router]);

  const modals = (
    <>
      <ServerFormModal
        visible={formVisible}
        onClose={() => {
          if (!loginLoading) setFormVisible(false);
        }}
        onSave={handleSave}
        initial={editingServer}
        isDark={isDark}
        loading={loginLoading}
        error={loginError}
      />
      <QrScanner
        visible={qrVisible}
        onClose={() => setQrVisible(false)}
        onNeedNewWorkspace={() => setNewWsVisible(true)}
      />
      <NewWorkspaceDialog visible={newWsVisible} onClose={handleNewWsClose} />
    </>
  );

  // First run: a list with an empty card and two action rows says less than one
  // clear invitation to connect.
  if (variant === "onboarding" && servers.length === 0) {
    return (
      <View style={styles.welcome}>
        <View style={styles.welcomeContent}>
          <View
            style={[
              styles.welcomeIcon,
              { backgroundColor: isDark ? "#fefdfd" : "#1a1a1a" },
            ]}
          >
            <PiLogo size={36} color={isDark ? "#1a1a1a" : "#fff"} />
          </View>
          <Text
            style={[styles.welcomeTitle, { color: p.text }]}
          >
            欢迎使用 PiDeck
          </Text>
          <Text style={[styles.welcomeDesc, { color: p.textTertiary }]}>
            连接一台运行 PiDeck 的电脑，{"\n"}
            就能打开它上面的项目。
          </Text>
          <View style={styles.welcomeButtons}>
            <Pressable
              onPress={() => setQrVisible(true)}
              style={({ pressed }) => [
                styles.welcomeButton,
                { borderWidth: StyleSheet.hairlineWidth, borderColor: p.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <QrCode size={16} color={p.text} strokeWidth={2} />
              <Text style={[styles.welcomeButtonText, { color: p.text }]}>
                扫码添加
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.welcomeButton,
                { backgroundColor: isDark ? "#fefdfd" : "#1a1a1a" },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Plus size={16} color={isDark ? "#1a1a1a" : "#fff"} strokeWidth={2} />
              <Text
                style={[
                  styles.welcomeButtonText,
                  { color: isDark ? "#1a1a1a" : "#fff" },
                ]}
              >
                添加服务器
              </Text>
            </Pressable>
          </View>
        </View>
        {modals}
      </View>
    );
  }

  return (
    <View style={{ gap: m.groupGap }}>
      <SettingsGroup
        header="服务器"
        footer="点击一台服务器即可连接。凭据保存在本机，不会同步。"
      >
        {servers.length === 0 ? (
          <View
            style={{
              paddingHorizontal: m.gutter,
              paddingVertical: m.rowPaddingV + 4,
            }}
          >
            <Text
              style={{
                fontSize: m.descSize,
                fontFamily: Fonts.sans,
                color: p.textTertiary,
              }}
            >
              尚未添加服务器。
            </Text>
          </View>
        ) : (
          servers.map((server, idx) => (
            <ServerRow
              key={server.id}
              server={server}
              isActive={server.id === activeServerId}
              isConnecting={connecting === server.id}
              isLast={idx === servers.length - 1}
              onPress={() => handleConnect(server)}
              onEdit={() => handleEdit(server)}
              onDelete={() => handleDelete(server)}
              isDark={isDark}
            />
          ))
        )}
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow icon={Plus} label="添加服务器" onPress={handleAdd} />
        <SettingsRow
          icon={QrCode}
          label="扫码添加"
          description="扫描 PiDeck 终端里显示的二维码"
          onPress={() => setQrVisible(true)}
          isLast
        />
      </SettingsGroup>

      <ServerFormModal
        visible={formVisible}
        onClose={() => {
          if (!loginLoading) setFormVisible(false);
        }}
        onSave={handleSave}
        initial={editingServer}
        isDark={isDark}
        loading={loginLoading}
        error={loginError}
      />
      <QrScanner
        visible={qrVisible}
        onClose={() => setQrVisible(false)}
        onNeedNewWorkspace={() => setNewWsVisible(true)}
      />
      <NewWorkspaceDialog visible={newWsVisible} onClose={handleNewWsClose} />
    </View>
  );
}

function ServerRow({
  server,
  isActive,
  isConnecting,
  isLast,
  onPress,
  onEdit,
  onDelete,
  isDark,
}: {
  server: Server;
  isActive: boolean;
  isConnecting: boolean;
  isLast: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDark: boolean;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`连接到 ${server.name}`}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: m.gutter,
          paddingVertical: m.rowPaddingV,
          minHeight: m.rowMinHeight,
        },
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: p.separator,
        },
        pressed && { backgroundColor: p.pressed },
      ]}
    >
      <View
        style={{
          width: m.tileSize,
          height: m.tileSize,
          borderRadius: m.tileRadius,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#fefdfd" : "#1a1a1a",
        }}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color={isDark ? "#1a1a1a" : "#fff"} />
        ) : (
          <PiLogo size={m.tileIcon} color={isDark ? "#1a1a1a" : "#fff"} />
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: m.labelSize,
              fontFamily: Fonts.sans,
              color: p.text,
            }}
            numberOfLines={1}
          >
            {server.name}
          </Text>
          {isActive && (
            <View style={styles.badge}>
              <View style={[styles.badgeDot, { backgroundColor: p.success }]} />
              <Text
                style={{
                  fontSize: 11,
                  lineHeight: 14,
                  fontFamily: Fonts.sansMedium,
                  color: p.success,
                }}
              >
                已连接
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            fontSize: m.descSize,
            fontFamily: Fonts.sans,
            color: p.textTertiary,
          }}
          numberOfLines={1}
        >
          {server.address}
        </Text>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        accessibilityLabel={`编辑 ${server.name}`}
        style={({ pressed }) => [styles.action, pressed && { opacity: 0.5 }]}
      >
        <Pencil size={15} color={p.textTertiary} strokeWidth={1.8} />
      </Pressable>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        accessibilityLabel={`移除 ${server.name}`}
        style={({ pressed }) => [styles.action, pressed && { opacity: 0.5 }]}
      >
        <Trash2 size={15} color={p.destructive} strokeWidth={1.8} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  welcome: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  welcomeContent: {
    alignItems: "center",
    maxWidth: 360,
  },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: Fonts.sansMedium,
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.sans,
    textAlign: "center",
    marginBottom: 24,
  },
  welcomeButtons: {
    flexDirection: "row",
    gap: 10,
  },
  welcomeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  welcomeButtonText: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  action: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
