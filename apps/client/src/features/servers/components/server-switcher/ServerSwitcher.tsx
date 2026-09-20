import { Check, ChevronDown, Settings } from 'lucide-react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { PiLogo } from '@/components/pi-logo';
import { useServerSwitcherController } from '../../hooks/use-server-switcher-controller';
export function ServerSwitcher() {
  const colors = useThemeTokens();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const {
    router,
    servers,
    activeServer,
    activeServerId,
    popoverVisible,
    setPopoverVisible,
    switchingId,
    handleSwitchServer
  } = useServerSwitcherController();
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const popoverBg = isDark ? '#252525' : '#FFFFFF';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const hoverBg = isDark ? '#333' : '#F5F5F5';
  const iconBg = isDark ? '#fefdfd' : '#1a1a1a';
  return <div className="relative flex flex-col" {...{
    'data-server-popover': true
  } as any}>
      <button className="flex h-7 w-full items-center gap-2 rounded-md px-1.5 text-left text-sm hover:bg-hover" onClick={() => setPopoverVisible(value => !value)} role="button" aria-label="Switch server">
        <span className="flex size-5 items-center justify-center rounded bg-foreground">
          <PiLogo size={14} color={isDark ? '#1a1a1a' : '#fff'} />
        </span>
        <span className="min-w-0 flex-1 truncate">{activeServer?.name ?? 'No Server'}</span>
        <ChevronDown size={12} color={textMuted} strokeWidth={2} />
      </button>
      {popoverVisible && <div role="menu" aria-label="Server selection" className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-md border border-border bg-card p-1 shadow-xl">
          <div className="px-2 pb-1 pt-1 text-[10px] font-medium uppercase tracking-wide text-text-secondary"><span>Servers</span></div>
          <div className="flex flex-col gap-0.5">
            {servers.map(server => {
          const isActive = server.id === activeServerId;
          const isSwitching = server.id === switchingId;
          return <button className={`flex min-h-9 w-full items-center gap-2 rounded px-2 text-left hover:bg-hover disabled:opacity-50 ${isActive ? 'bg-hover' : ''}`} key={server.id} onClick={() => void handleSwitchServer(server)} disabled={isSwitching} role="menuitem">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-foreground"><PiLogo size={11} color={isDark ? '#1a1a1a' : '#fff'} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs">{server.name}</span><span className="block truncate text-[10px] text-text-secondary">{server.address}</span></span>
                  {isSwitching ? <span className="size-3 shrink-0 animate-spin rounded-full border border-primary border-r-transparent" /> : isActive && <Check size={14} className="shrink-0 text-success" strokeWidth={2.5} />}
                </button>;
        })}
          </div>
          <div className="mt-1 border-t border-border pt-1">
            <button className="flex h-7 w-full items-center gap-2 rounded px-2 text-left text-xs text-text-secondary hover:bg-hover" onClick={() => {
          setPopoverVisible(false);
          router.push('/settings/servers');
        }}>
              <Settings size={13} color={textMuted} strokeWidth={1.8} />
              <span>管理服务器</span>
            </button>
          </div>
        </div>}
    </div>;
}
