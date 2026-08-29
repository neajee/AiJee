import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Copy, Pencil, Plus, QrCode, RefreshCw, Trash2, X } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import QRCode from "qrcode";

import { Fonts } from "@/constants/theme";
import { PiLogo } from "@/components/pi-logo";
import { useServersStore, type Server } from "@/features/servers/store";
import { useAuthStore } from "@/features/auth/store";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useOptionalPiClient } from "@pideck/client-sdk";
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
  const client = useOptionalPiClient();

  const { servers, loaded, load, addServer, updateServer, removeServer } =
    useServersStore();
  const logoutFromServer = useAuthStore((s) => s.logoutFromServer);
  const activeServerId = useAuthStore((s) => s.activeServerId);

  const [formVisible, setFormVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | undefined>();
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [newWsVisible, setNewWsVisible] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [refreshingCode, setRefreshingCode] = useState(false);
  const [codeDialog, setCodeDialog] = useState<{ code: string; url: string; image: string } | null>(null);

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

  const handleShowCode = useCallback(async () => {
    if (!client) {
      setLoginError("当前页面尚未连接设备，无法生成授权码。");
      return;
    }
    try {
      const result = await client.api.getDeviceCode();
      const image = await QRCode.toDataURL(result.url, { width: 240, margin: 1 });
      setCodeDialog({ code: result.code, url: result.url, image });
    } catch (error) {
      Alert.alert("获取授权码失败", error instanceof Error ? error.message : "请稍后重试");
    }
  }, [client]);

  const handleRefreshCode = useCallback(async () => {
    if (!client || refreshingCode || !activeServerId) return;
    const server = servers.find((entry) => entry.id === activeServerId);
    if (!server) return;
    setRefreshingCode(true);
    try {
      const result = await client.api.createDeviceCode();
      const authorized = await useAuthStore.getState().authorizeWithCode(
        server.address,
        result.code,
        server.id,
        server.name,
      );
      if (!authorized.success) throw new Error(authorized.error ?? "更新设备令牌失败");
      const image = await QRCode.toDataURL(result.url, { width: 240, margin: 1 });
      setCodeDialog({ code: result.code, url: result.url, image });
    } catch (error) {
      Alert.alert("刷新授权码失败", error instanceof Error ? error.message : "请稍后重试");
    } finally {
      setRefreshingCode(false);
    }
  }, [activeServerId, client, refreshingCode, servers]);

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
      try {
        const auth = useAuthStore.getState();
        setConnecting(server.id);

        if (server.id === activeServerId) {
          await navigateAfterConnect();
          return;
        }

        const connected = auth.hasToken(server.id)
          ? await auth.activateServer(server)
          : false;

        if (connected) {
          await navigateAfterConnect();
        } else {
          // A stored token that no longer works is indistinguishable from none:
          // ask for credentials rather than failing silently.
          setEditingServer(server);
          setLoginError("设备授权已失效，请重新扫描授权码。");
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

      const serverData = data;
      let server: Server;
      if (editingServer) {
        await updateServer(editingServer.id, serverData);
        server = { ...editingServer, ...serverData };
      } else {
        await addServer(serverData);
        const current = useServersStore.getState().servers;
        server = current[current.length - 1];
      }

      setLoginLoading(false);
      setFormVisible(false);
      setLoginError("请扫描设备端生成的一次性授权码完成连接。");
    },
    [editingServer, addServer, updateServer],
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
            连接到运行 PiDeck 的设备，{"\n"}
            使用设备授权后即可打开工作区。
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
                扫描授权码
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
        footer="点击设备即可连接。设备令牌仅保存在本机，不会同步。"
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
              onShowCode={handleShowCode}
              isDark={isDark}
            />
          ))
        )}
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow icon={Plus} label="添加服务器" onPress={handleAdd} />
        <SettingsRow
          icon={QrCode}
          label="扫描授权码"
          description="扫描 PiDeck 设备端生成的授权二维码"
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
      <Modal visible={!!codeDialog} transparent animationType="fade" onRequestClose={() => setCodeDialog(null)}>
        <Pressable style={styles.codeBackdrop} onPress={() => setCodeDialog(null)} accessibilityLabel="关闭授权对话框">
          <Pressable
            style={[styles.codeDialog, { backgroundColor: p.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.codeHeader}>
              <Text style={[styles.codeTitle, { color: p.text }]}>设备授权二维码</Text>
              <Pressable
                onPress={() => setCodeDialog(null)}
                accessibilityLabel="关闭授权二维码"
                hitSlop={8}
                style={styles.closeCodeButton}
              >
                <X size={18} color={p.textTertiary} />
              </Pressable>
            </View>
            {codeDialog && <Image source={{ uri: codeDialog.image }} style={styles.codeImage} />}
            <View style={styles.codeRow}>
              <Text style={[styles.codeLabel, { color: p.textTertiary }]}>授权码</Text>
              <Text selectable style={[styles.codeValue, { color: p.text }]}>{codeDialog?.code}</Text>
              <Pressable
                onPress={() => codeDialog && Clipboard.setStringAsync(codeDialog.url)}
                accessibilityLabel="复制完整地址"
                accessibilityHint="复制设备连接地址"
                style={styles.copyUrlButton}
              >
                <Copy size={18} color={p.text} />
              </Pressable>
              <Pressable
                onPress={handleRefreshCode}
                disabled={refreshingCode}
                accessibilityLabel="刷新授权码"
                accessibilityHint="生成新授权码并更新当前设备令牌"
                style={styles.copyUrlButton}
              >
                {refreshingCode ? (
                  <ActivityIndicator size="small" color={p.text} />
                ) : (
                  <RefreshCw size={18} color={p.text} />
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  onShowCode,
  isDark,
}: {
  server: Server;
  isActive: boolean;
  isConnecting: boolean;
  isLast: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShowCode: () => void;
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
          onShowCode();
        }}
        accessibilityLabel={`显示 ${server.name} 授权二维码`}
        style={({ pressed }) => [styles.action, pressed && { opacity: 0.5 }]}
      >
        <QrCode size={15} color={p.textTertiary} strokeWidth={1.8} />
      </Pressable>
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
  codeBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    padding: 24,
  },
  codeDialog: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderRadius: 14,
    padding: 24,
    gap: 10,
  },
  codeTitle: {
    fontSize: 17,
    fontFamily: Fonts.sansMedium,
  },
  codeHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeImage: {
    width: 240,
    height: 240,
    marginVertical: 6,
  },
  codeLabel: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  codeValue: {
    fontSize: 18,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  copyUrlButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  closeCodeButton: {
    paddingVertical: 4,
  },
});
