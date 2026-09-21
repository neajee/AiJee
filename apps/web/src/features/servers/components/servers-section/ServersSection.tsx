import { Copy, Pencil, Plus, QrCode, RefreshCw, X } from "lucide-react";
import * as Clipboard from "@/platform/clipboard";
import { PiLogo } from "@/components/pi-logo";
import { useSettingsPalette } from "@/components/settings-surface";
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
    return <div className="flex min-h-full flex-col items-center justify-center gap-6 px-[var(--gutter)] py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <PiLogo size={36} color={isDark ? "#1a1a1a" : "#fff"} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[var(--title-size)] font-semibold text-foreground">欢迎使用 AiJee</span>
          <span className="max-w-md text-[var(--desc-size)] text-text-secondary">
            连接到运行 AiJee 的设备，使用设备授权后即可打开工作区。
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setQrVisible(true)} className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-4 text-caption font-medium text-text-secondary hover:bg-hover">
            <QrCode size={16} strokeWidth={2} />
            <span>扫描授权码</span>
          </button>
          <button onClick={handleAdd} className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-caption font-medium text-accent-content hover:opacity-90">
            <Plus size={16} strokeWidth={2} />
            <span>添加服务器</span>
          </button>
        </div>
        {modals}
      </div>;
  }
  return <div className="flex flex-col gap-[var(--group-gap)]">
      <div className="flex flex-col gap-0.5 px-[var(--gutter)]">
        <span className="text-[var(--title-size)] font-semibold text-foreground">我的设备 ({servers.length})</span>
      </div>
      <div className="overflow-hidden rounded-[var(--card-radius)]">
        {servers.length === 0 ? <div className="px-[var(--gutter)] py-3 text-[var(--desc-size)] text-text-tertiary">
            尚未添加服务器。
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

      {modals}
      {menuServerId && menuPosition ? <div className="fixed inset-0 z-40" onClick={() => {
      setMenuServerId(null);
      setMenuPosition(null);
    }}>
        <div className="absolute z-50 w-[220px] rounded-md border border-border bg-card p-1 shadow-xl" style={{ left: menuPosition.left, top: menuPosition.top }} onClick={event => event.stopPropagation()}>
          {(() => {
          const server = servers.find(entry => entry.id === menuServerId);
          if (!server) return null;
          return <>
                <MenuAction icon={Pencil} label="编辑" onClick={() => {
              setMenuServerId(null);
              setMenuPosition(null);
              handleEdit(server);
            }} color={p.text} />
                <MenuAction icon={X} label="断开连接" onClick={() => {
              setMenuServerId(null);
              setMenuPosition(null);
              logoutFromServer(server.id);
            }} color={p.text} />
              </>;
        })()}
        </div>
      </div> : null}
      {codeDialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
        <button className="absolute inset-0 size-full cursor-default" onClick={() => setCodeDialog(null)} aria-label="关闭授权对话框" />
          <section className="relative w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--label-size)] font-medium text-foreground">设备授权二维码</span>
              <button onClick={() => setCodeDialog(null)} aria-label="关闭授权二维码" className="flex size-7 items-center justify-center rounded-md text-text-tertiary hover:bg-hover">
                <X size={18} />
              </button>
            </div>
            <img src={codeDialog.image} alt="设备授权二维码" className="mx-auto my-4 max-h-64 max-w-full object-contain" />
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[var(--desc-size)] text-text-secondary">授权码</span>
              <span className="min-w-0 flex-1 truncate font-mono text-caption text-foreground">{codeDialog?.code}</span>
              <button onClick={() => codeDialog && Clipboard.setStringAsync(codeDialog.url)} aria-label="复制完整地址" className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-hover">
                <Copy size={18} />
              </button>
              <button onClick={handleRefreshCode} disabled={refreshingCode} aria-label="刷新授权码" className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-hover disabled:opacity-50">
                {refreshingCode ? <span className="size-3 animate-spin rounded-full border-2 border-border border-t-text-tertiary" /> : <RefreshCw size={18} />}
              </button>
            </div>
          </section>
      </div>}
    </div>;
}
