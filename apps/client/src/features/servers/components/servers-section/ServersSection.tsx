import { Copy, Pencil, Plus, QrCode, RefreshCw, Trash2, X } from "lucide-react";
import * as Clipboard from "@/platform/clipboard";
import { Fonts } from "@/constants/theme";
import { PiLogo } from "@/components/pi-logo";
import { useSettingsMetrics, useSettingsPalette } from "@/components/settings-surface";
import { QrScanner } from "@/features/servers/components/qr-scanner";
import { ServerFormModal } from "../server-form";
import { FooterAction, MenuAction, ServerRow } from "./rows";
import type { ServersController } from "../../hooks/use-servers-controller";
export function ServersView({
  controller,
  isDark,
  variant
}: {
  controller: ServersController;
  isDark: boolean;
  variant: "settings" | "onboarding";
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const {
    router,
    servers,
    activeServerId,
    formVisible,
    editingServer,
    loginLoading,
    loginError,
    qrVisible,
    connecting,
    failedServerId,
    lastConnected,
    menuServerId,
    menuPosition,
    refreshingCode,
    codeDialog,
    setFormVisible,
    setQrVisible,
    setMenuServerId,
    setMenuPosition,
    setCodeDialog,
    logoutFromServer,
    handleAdd,
    handleEdit,
    handleDelete,
    handleShowCode,
    handleRefreshCode,
    handleConnect,
    handleSave
  } = controller;
  const modals = <>
      <ServerFormModal visible={formVisible} onClose={() => {
      if (!loginLoading) setFormVisible(false);
    }} onSave={handleSave} initial={editingServer} isDark={isDark} loading={loginLoading} error={loginError} />
      <QrScanner visible={qrVisible} onClose={() => setQrVisible(false)} onNeedNewWorkspace={() => router.replace("/")} />
    </>;

  // First run: a list with an empty card and two action rows says less than one
  // clear invitation to connect.
  if (variant === "onboarding" && servers.length === 0) {
    return <div className={"block"}>
        <div className={"block"}>
          <div className={" "}>
            <PiLogo size={36} color={isDark ? "#1a1a1a" : "#fff"} />
          </div>
          <span className={" "}>
            欢迎使用 AiJee
          </span>
          <span className={" "}>
            连接到运行 AiJee 的设备，{"\n"}
            使用设备授权后即可打开工作区。
          </span>
          <div className={"block"}>
            <button onClick={() => setQrVisible(true)}>
              <QrCode size={16} color={p.text} strokeWidth={2} />
              <span className={" "}>
                扫描授权码
              </span>
            </button>
            <button onClick={handleAdd}>
              <Plus size={16} color={isDark ? "#1a1a1a" : "#fff"} strokeWidth={2} />
              <span className={" "}>
                添加服务器
              </span>
            </button>
          </div>
        </div>
        {modals}
      </div>;
  }
  return <div className={"  gap-[var(--group-gap)]"}>
      <div className={"block"}>
        <span className={" "}>我的设备 ({servers.length})</span>
        <span className={" "}>设备令牌仅保存在本机，不会同步</span>
      </div>
      <div className={" "}>
        {servers.length === 0 ? <div className={"pl-[var(--gutter)] pr-[var(--gutter)] pt-0 pb-0"}>
            <span className={"text-[var(--desc-size)] font-sans"}>
              尚未添加服务器。
            </span>
          </div> : servers.map((server, idx) => <ServerRow key={server.id} server={server} isActive={server.id === activeServerId} isConnecting={connecting === server.id} isFailed={failedServerId === server.id} lastConnectedAt={lastConnected[server.id]} isLast={idx === servers.length - 1} onClick={() => handleConnect(server)} onShowCode={handleShowCode} onToggleMenu={measure => {
        if (menuServerId === server.id) {
          setMenuServerId(null);
          setMenuPosition(null);
          return;
        }
        measure((x, y, width, height) => {
          setMenuPosition({
            left: Math.max(12, x + width - 220),
            top: y + height + 6
          });
          setMenuServerId(server.id);
        });
      }} />)}
        <FooterAction icon={Plus} label="添加服务器" onClick={handleAdd} isFirst />
        <FooterAction icon={QrCode} label="扫描授权码" onClick={() => setQrVisible(true)} isLast />
      </div>

      <ServerFormModal visible={formVisible} onClose={() => {
      if (!loginLoading) setFormVisible(false);
    }} onSave={handleSave} initial={editingServer} isDark={isDark} loading={loginLoading} error={loginError} />
      <QrScanner visible={qrVisible} onClose={() => setQrVisible(false)} onNeedNewWorkspace={() => router.replace("/")} />
      <div transparent visible={!!menuServerId} animationType="fade" onRequestClose={() => setMenuServerId(null)}>
        <button className={"block"} onClick={() => {
        setMenuServerId(null);
        setMenuPosition(null);
      }} aria-label="关闭服务器操作菜单">
          {(() => {
          const server = servers.find(entry => entry.id === menuServerId);
          if (!server) return null;
          return <button className={" "} onClick={event => event.stopPropagation()}>
                <MenuAction icon={Pencil} label="编辑" onClick={() => {
              setMenuServerId(null);
              handleEdit(server);
            }} color={p.text} />
                <MenuAction icon={X} label="断开连接" onClick={() => {
              setMenuServerId(null);
              logoutFromServer(server.id);
            }} color={p.text} />
                <div className={" "} />
                <MenuAction icon={Trash2} label="删除" onClick={() => {
              setMenuServerId(null);
              handleDelete(server);
            }} color={p.destructive} />
              </button>;
        })()}
        </button>
      </div>
      <div visible={!!codeDialog} transparent animationType="fade" onRequestClose={() => setCodeDialog(null)}>
        <button className={"block"} onClick={() => setCodeDialog(null)} aria-label="关闭授权对话框">
          <button className={" "} onClick={e => e.stopPropagation()}>
            <div className={"block"}>
              <span className={" "}>设备授权二维码</span>
              <button onClick={() => setCodeDialog(null)} aria-label="关闭授权二维码" hitSlop={8} className={"block"}>
                <X size={18} color={p.textTertiary} />
              </button>
            </div>
            {codeDialog && <img src={{
            uri: codeDialog.image
          }} className={"block"} />}
            <div className={"block"}>
              <span className={" "}>授权码</span>
              <span selectable className={" "}>{codeDialog?.code}</span>
              <button onClick={() => codeDialog && Clipboard.setStringAsync(codeDialog.url)} aria-label="复制完整地址" accessibilityHint="复制设备连接地址" className={"block"}>
                <Copy size={18} color={p.text} />
              </button>
              <button onClick={handleRefreshCode} disabled={refreshingCode} aria-label="刷新授权码" accessibilityHint="生成新授权码并更新当前设备令牌" className={"block"}>
                {refreshingCode ? <span size="small" color={p.text} /> : <RefreshCw size={18} color={p.text} />}
              </button>
            </div>
          </button>
        </button>
      </div>
    </div>;
}
