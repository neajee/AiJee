import { useRef } from "react";
import { MoreHorizontal, QrCode } from "lucide-react";
import { PiLogo } from "@/components/pi-logo";
import { useSettingsPalette } from "@/components/settings-surface";
import type { Server } from "@/features/servers/store";
function ConnectionStatusDot({
  label,
  color,
  connecting
}: {
  label: string;
  color: string;
  connecting: boolean;
}) {
  return <span aria-label={label} className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color, opacity: connecting ? 0.5 : 1 }} />;
}
export function ServerRow({
  server,
  isActive,
  isConnecting,
  isFailed,
  lastConnectedAt,
  onClick,
  onShowCode,
  onToggleMenu
}: {
  server: Server;
  isActive: boolean;
  isConnecting: boolean;
  isFailed: boolean;
  lastConnectedAt?: number;
  isLast: boolean;
  onClick: () => void;
  onShowCode: () => void;
  onToggleMenu: (measure: (callback: (x: number, y: number, width: number, height: number) => void) => void) => void;
}) {
  const p = useSettingsPalette();
  const moreRef = useRef<HTMLButtonElement>(null);
  const address = server.address.replace(/^https?:\/\//, '');
  const minutes = lastConnectedAt ? Math.max(1, Math.floor((Date.now() - lastConnectedAt) / 60_000)) : null;
  const status = isConnecting ? {
    label: '连接中…',
    color: p.notification
  } : isFailed ? {
    label: '连接失败 · 点击重试',
    color: p.destructive
  } : isActive ? {
    label: `${address} · 已连接`,
    color: p.success
  } : {
    label: minutes ? `上次连接 ${minutes} 分钟前` : '离线 · 尚无连接记录',
    color: p.textTertiary
  };
  return <div className="flex flex-col">
      <div className="flex min-h-[var(--row-min-height)] items-center gap-1 pr-2 hover:bg-hover">
        <button onClick={onClick} role="button" aria-label={`连接到 ${server.name}，${status.label}`} className="flex min-w-0 flex-1 items-center gap-[var(--row-gap)] pl-[var(--gutter)] text-left">
          <ConnectionStatusDot label={status.label} color={status.color} connecting={isConnecting} />
          <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-muted">
            {isConnecting ? <span className="size-3 animate-spin rounded-full border-2 border-border border-t-text-tertiary" /> : <PiLogo size={16} color={p.textSecondary} />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <span className="truncate font-sans text-body text-foreground">{server.name}</span>
            <span className="truncate font-mono text-caption text-text-tertiary">{status.label}</span>
          </div>
        </button>

        <button onClick={onShowCode} role="button" aria-label={`显示 ${server.name} 授权二维码`} className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-hover">
          <QrCode size={18} strokeWidth={1.5} />
        </button>
        <button ref={moreRef} onClick={() => onToggleMenu(callback => {
        const rect = moreRef.current?.getBoundingClientRect();
        if (rect) callback(rect.left, rect.top, rect.width, rect.height);
      })} role="button" aria-label={`管理 ${server.name}`} className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-hover">
          <MoreHorizontal size={18} strokeWidth={1.8} />
        </button>
      </div>
    </div>;
}
export function FooterAction({
  icon: Icon,
  label,
  onClick
}: {
  icon: any;
  label: string;
  onClick: () => void;
  isLast?: boolean;
  isFirst?: boolean;
}) {
  const p = useSettingsPalette();
  return <button onClick={onClick} role="button" aria-label={label} className="flex min-h-[var(--row-min-height)] w-full items-center justify-center gap-1.5 px-[var(--gutter)] text-caption text-text-secondary hover:bg-hover">
      <Icon size={16} color={p.textSecondary} strokeWidth={1.8} />
      <span>{label}</span>
    </button>;
}
export function MenuAction({
  icon: Icon,
  label,
  onClick,
  color
}: {
  icon: any;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return <button onClick={onClick} role="button" aria-label={label} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-caption text-foreground hover:bg-hover"><Icon size={16} color={color} strokeWidth={1.8} /><span>{label}</span></button>;
}
