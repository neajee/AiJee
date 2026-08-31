import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Copy, MoreHorizontal, Pencil, Plus, QrCode, RefreshCw, Trash2, X } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import QRCode from "qrcode";

import { Fonts } from "@/constants/theme";
import { PiLogo } from "@/components/pi-logo";
import { useServersStore, type Server } from "@/features/servers/store";
import { useAuthStore } from "@/features/auth/store";
import { useWorkspaceStore } from "@/features/workspace/store";
import { useOptionalPiClient } from "@aijee/client-sdk";
import { QrScanner } from "@/features/servers/components/qr-scanner";
import {
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
  const [connecting, setConnecting] = useState<string | null>(null);
  const [failedServerId, setFailedServerId] = useState<string | null>(null);
  const [lastConnected, setLastConnected] = useState<Record<string, number>>({});
  const [menuServerId, setMenuServerId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
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

  const navigateAfterConnect = useCallback(async () => {
    const ws = useWorkspaceStore.getState();
    const serverId = useAuthStore.getState().activeServerId;
    await ws.switchServer(serverId);
    await ws.fetchWorkspaces(serverId);
    router.replace("/");
  }, [router]);

  const handleConnect = useCallback(
    async (server: Server) => {
      try {
        const auth = useAuthStore.getState();
        setConnecting(server.id);

        if (server.id === activeServerId) {
          setLastConnected((current) => ({ ...current, [server.id]: Date.now() }));
          await navigateAfterConnect();
          return;
        }

        const connected = auth.hasToken(server.id)
          ? await auth.activateServer(server)
          : false;

        if (connected) {
          setFailedServerId(null);
          setLastConnected((current) => ({ ...current, [server.id]: Date.now() }));
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
        setFailedServerId(server.id);
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
        onNeedNewWorkspace={() => router.replace("/")}
      />
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
            欢迎使用 AiJee
          </Text>
          <Text style={[styles.welcomeDesc, { color: p.textTertiary }]}>
            连接到运行 AiJee 的设备，{"\n"}
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
    <View style={[styles.content, { gap: m.groupGap }]}>
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: p.textSecondary }]}>我的设备 ({servers.length})</Text>
        <Text style={[styles.sectionCaption, { color: p.textTertiary }]}>设备令牌仅保存在本机，不会同步</Text>
      </View>
      <View style={[styles.serverCard, { backgroundColor: p.card, borderColor: p.separator }]}>
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
              isFailed={failedServerId === server.id}
              lastConnectedAt={lastConnected[server.id]}
              isLast={idx === servers.length - 1}
              onPress={() => handleConnect(server)}
              onShowCode={handleShowCode}
              onToggleMenu={(measure) => {
                if (menuServerId === server.id) {
                  setMenuServerId(null);
                  setMenuPosition(null);
                  return;
                }
                measure((x, y, width, height) => {
                  setMenuPosition({ left: Math.max(12, x + width - 220), top: y + height + 6 });
                  setMenuServerId(server.id);
                });
              }}
            />
          ))
        )}
        <FooterAction icon={Plus} label="添加服务器" onPress={handleAdd} isFirst />
        <FooterAction icon={QrCode} label="扫描授权码" onPress={() => setQrVisible(true)} isLast />
      </View>

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
        onNeedNewWorkspace={() => router.replace("/")}
      />
      <Modal transparent visible={!!menuServerId} animationType="fade" onRequestClose={() => setMenuServerId(null)}>
        <Pressable style={styles.menuBackdrop} onPress={() => { setMenuServerId(null); setMenuPosition(null); }} accessibilityLabel="关闭服务器操作菜单">
          {(() => {
            const server = servers.find((entry) => entry.id === menuServerId);
            if (!server) return null;
            return (
              <Pressable style={[styles.menuSheet, menuPosition, { backgroundColor: p.card, borderColor: p.border }]} onPress={(event) => event.stopPropagation()}>
                <MenuAction icon={Pencil} label="编辑" onPress={() => { setMenuServerId(null); handleEdit(server); }} color={p.text} />
                <MenuAction icon={X} label="断开连接" onPress={() => { setMenuServerId(null); logoutFromServer(server.id); }} color={p.text} />
                <View style={[styles.menuDivider, { backgroundColor: p.separator }]} />
                <MenuAction icon={Trash2} label="删除" onPress={() => { setMenuServerId(null); handleDelete(server); }} color={p.destructive} />
              </Pressable>
            );
          })()}
        </Pressable>
      </Modal>
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

function ConnectionStatusDot({ label, color, connecting }: { label: string; color: string; connecting: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!connecting) { opacity.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [connecting, opacity]);
  return <Animated.View accessibilityLabel={label} style={[styles.statusDot, { backgroundColor: color, opacity }]} />;
}

function ServerRow({
  server,
  isActive,
  isConnecting,
  isFailed,
  lastConnectedAt,
  isLast,
  onPress,
  onShowCode,
  onToggleMenu,
}: {
  server: Server;
  isActive: boolean;
  isConnecting: boolean;
  isFailed: boolean;
  lastConnectedAt?: number;
  isLast: boolean;
  onPress: () => void;
  onShowCode: () => void;
  onToggleMenu: (measure: (callback: (x: number, y: number, width: number, height: number) => void) => void) => void;
}) {
  const p = useSettingsPalette();
  const [hovered, setHovered] = useState(false);
  const moreRef = useRef<any>(null);
  const address = server.address.replace(/^https?:\/\//, '');
  const minutes = lastConnectedAt ? Math.max(1, Math.floor((Date.now() - lastConnectedAt) / 60_000)) : null;
  const status = isConnecting
    ? { label: '连接中…', color: p.notification }
    : isFailed
      ? { label: '连接失败 · 点击重试', color: p.destructive }
      : isActive
        ? { label: `${address} · 已连接`, color: p.success }
        : { label: minutes ? `上次连接 ${minutes} 分钟前` : '离线 · 尚无连接记录', color: p.textTertiary };

  return (
    <View style={styles.serverRowWrap}>
      {isActive ? <View style={[styles.activeRail, { backgroundColor: p.success }]} /> : null}
      <Pressable
        onPress={onPress}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        accessibilityRole="button"
        accessibilityLabel={`连接到 ${server.name}，${status.label}`}
        style={({ pressed, hovered: rowHovered, focused }: any) => [styles.serverRow, isActive && { backgroundColor: p.pressed }, (pressed || rowHovered) && { backgroundColor: p.pressed }, focused && { outlineWidth: 2, outlineColor: p.accent, outlineOffset: 2 } as any]}
      >
      <ConnectionStatusDot label={status.label} color={status.color} connecting={isConnecting} />
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: p.tile,
        }}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color={p.text} />
        ) : (
          <PiLogo size={16} color={p.textSecondary} />
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 13, fontFamily: Fonts.sansMedium, color: p.text }} numberOfLines={1}>{server.name}</Text>
        <View style={styles.statusLine}>
          <Text style={{ fontSize: 12, fontFamily: Fonts.mono, color: p.textTertiary, opacity: 0.55 }} numberOfLines={1}>{status.label}</Text>
        </View>
      </View>
      </Pressable>

      <Pressable
        onPress={onShowCode}
        accessibilityRole="button"
        accessibilityLabel={`显示 ${server.name} 授权二维码`}
        hitSlop={8}
        style={({ pressed, hovered: qrHovered, focused }: any) => [styles.qrAction, (pressed || qrHovered) && { backgroundColor: p.pressed }, focused && { outlineWidth: 2, outlineColor: p.accent, outlineOffset: 2 } as any]}
      >
        <QrCode size={20} color={p.textSecondary} strokeWidth={1.5} />
      </Pressable>
      <Pressable
        ref={moreRef}
        onPress={() => onToggleMenu((callback) => moreRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => callback(x, y, width, height)))}
        accessibilityRole="button"
        accessibilityLabel={`管理 ${server.name}`}
        hitSlop={8}
        style={({ pressed, hovered: moreHovered, focused }: any) => [styles.moreAction, (hovered || pressed || moreHovered || focused || Platform.OS !== 'web') && { opacity: 1 }, (pressed || moreHovered || focused) && { backgroundColor: p.pressed }, focused && { outlineWidth: 2, outlineColor: p.accent, outlineOffset: 2 } as any]}
      >
        <MoreHorizontal size={20} color={p.textSecondary} strokeWidth={1.8} />
      </Pressable>
      {!isLast ? <View style={[styles.rowDivider, { backgroundColor: p.separator }]} /> : null}
    </View>
  );
}

function FooterAction({ icon: Icon, label, onPress, isLast = false, isFirst = false }: { icon: any; label: string; onPress: () => void; isLast?: boolean; isFirst?: boolean }) {
  const p = useSettingsPalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed, hovered }: any) => [
        styles.footerAction,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator },
        (pressed || hovered) && { backgroundColor: p.pressed },
        isFirst && { position: 'relative' },
      ]}
    >
      {isFirst ? <View style={[styles.footerDivider, { backgroundColor: p.separator }]} /> : null}
      <Icon size={16} color={p.textSecondary} strokeWidth={1.8} />
      <Text style={[styles.footerActionText, { color: p.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

function MenuAction({ icon: Icon, label, onPress, color }: { icon: any; label: string; onPress: () => void; color: string }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.menuAction, pressed && { opacity: 0.6 }]}><Icon size={16} color={color} strokeWidth={1.8} /><Text style={[styles.menuActionText, { color }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { width: '100%' },
  // Heading lines up with the card edge, the same way ModelSection titles do.
  sectionHeading: { gap: 6 },
  sectionTitle: { fontSize: 13, fontFamily: Fonts.sansMedium },
  sectionCaption: { fontSize: 12, fontFamily: Fonts.sans, opacity: 0.5, marginTop: 4 },
  serverCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, overflow: 'hidden' },
  serverRowWrap: { minHeight: 56, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  activeRail: { width: 2, alignSelf: 'stretch' },
  serverRow: { flex: 1, minWidth: 0, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  statusLine: { minWidth: 0 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: -4 },
  // Aligned with the model list's divider (12 padding + 30 tile + 12 gap).
  rowDivider: { position: 'absolute', left: 54, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  qrAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  moreAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginLeft: 12, marginRight: 12, opacity: 0, transitionProperty: 'opacity, background-color', transitionDuration: '120ms' } as any,
  menuBackdrop: { flex: 1 },
  menuSheet: { width: 220, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingVertical: 4, position: 'absolute', boxShadow: '0 6px 18px rgba(0,0,0,.16)' } as any,
  menuAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  menuActionText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  menuDivider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  footerAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  footerActionText: { fontSize: 13, fontFamily: Fonts.sansMedium, opacity: 0.7 },
  footerDivider: { position: 'absolute', top: 0, left: 12, right: 0, height: StyleSheet.hairlineWidth },
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
