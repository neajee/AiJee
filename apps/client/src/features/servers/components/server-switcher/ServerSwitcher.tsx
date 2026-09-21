import { Check, ChevronDown, Settings } from 'lucide-react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PiLogo } from '@/components/pi-logo';
import { useServerSwitcherController } from '../../hooks/use-server-switcher-controller';
export function ServerSwitcher() {
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
  return <div className="relative flex flex-col" {...{
    'data-server-popover': true
  } as any}>
      <button className="flex h-7 w-full items-center gap-2 rounded-md px-1.5 text-left text-body hover:bg-hover" onClick={() => setPopoverVisible(value => !value)} role="button" aria-label="Switch server">
        <span className="flex size-5 items-center justify-center rounded bg-foreground">
          <PiLogo size={14} color={isDark ? '#1a1a1a' : '#fff'} />
        </span>
        <span className="min-w-0 flex-1 truncate">{activeServer?.name ?? 'No Server'}</span>
        <ChevronDown size={12} className="text-text-tertiary" strokeWidth={2} />
      </button>
      {popoverVisible && <div role="menu" aria-label="Server selection" className="absolute left-0 top-full z-50 mt-1 w-60 bg-background p-2 shadow-2xl">
          <div className="px-2 pb-2 pt-1 text-meta font-medium uppercase tracking-wide text-text-secondary"><span>Servers</span></div>
          <div className="flex flex-col gap-0.5">
            {servers.map(server => {
          const isActive = server.id === activeServerId;
          const isSwitching = server.id === switchingId;
          return <button className={`flex min-h-9 w-full items-center gap-2 rounded px-2 text-left hover:bg-hover disabled:opacity-50 ${isActive ? 'bg-hover' : ''}`} key={server.id} onClick={() => void handleSwitchServer(server)} disabled={isSwitching} role="menuitem">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-foreground"><PiLogo size={11} color={isDark ? '#1a1a1a' : '#fff'} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-caption">{server.name}</span><span className="block truncate text-meta text-text-secondary">{server.address}</span></span>
                  {isSwitching ? <span className="size-3 shrink-0 animate-spin rounded-full border border-primary border-r-transparent" /> : isActive && <Check size={14} className="shrink-0 text-success" strokeWidth={2.5} />}
                </button>;
        })}
          </div>
          <div className="mt-2 pt-1">
            <button className="flex h-7 w-full items-center gap-2 rounded px-2 text-left text-caption text-text-secondary hover:bg-hover" onClick={() => {
          setPopoverVisible(false);
          router.push('/settings/servers');
        }}>
              <Settings size={13} className="text-text-tertiary" strokeWidth={1.8} />
              <span>管理服务器</span>
            </button>
          </div>
        </div>}
    </div>;
}
