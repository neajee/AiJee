import { Modal, Platform, Pressable } from 'react-native';
import { Image, Spinner, Text, View } from "tamagui";
import { Copy, Pencil, Plus, QrCode, RefreshCw, Trash2, X } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { Fonts } from "@/constants/theme";
import { PiLogo } from "@/components/pi-logo";
import { useSettingsMetrics, useSettingsPalette } from "@/components/settings-surface";
import { QrScanner } from "@/features/servers/components/qr-scanner";
import { ServerFormModal } from "../server-form";
import { FooterAction, MenuAction, ServerRow } from "./rows";
import { styles } from "./styles";
import type { ServersController } from "../../hooks/use-servers-controller";

export function ServersView({ controller, isDark, variant }: { controller: ServersController; isDark: boolean; variant: "settings" | "onboarding" }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const {
    router, servers, activeServerId, formVisible, editingServer, loginLoading, loginError, qrVisible, connecting, failedServerId,
    lastConnected, menuServerId, menuPosition, refreshingCode, codeDialog, setFormVisible, setQrVisible, setMenuServerId, setMenuPosition, setCodeDialog,
    logoutFromServer, handleAdd, handleEdit, handleDelete, handleShowCode, handleRefreshCode, handleConnect, handleSave,
  } = controller;
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
                { borderWidth: 0.5, borderColor: p.border },
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
              paddingLeft: m.gutter, paddingRight: m.gutter,
              paddingTop: m.rowPaddingV + 4, paddingBottom: m.rowPaddingV + 4,
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
                  <Spinner size="small" color={p.text} />
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
