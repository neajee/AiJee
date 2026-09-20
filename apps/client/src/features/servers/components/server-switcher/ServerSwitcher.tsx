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
  return <div className={"block"} {...{
    'data-server-popover': true
  } as any}>
      <button onClick={() => setPopoverVisible(value => !value)} role="button" aria-label="Switch server">
        <div>
          <PiLogo size={14} color={isDark ? '#1a1a1a' : '#fff'} />
        </div>
        <span>{activeServer?.name ?? 'No Server'}</span>
        <ChevronDown size={12} color={textMuted} strokeWidth={2} />
      </button>
      {popoverVisible && <div>
          <div className={"block"}><span>Servers</span></div>
          <div className={"block"}>
            {servers.map(server => {
          const isActive = server.id === activeServerId;
          const isSwitching = server.id === switchingId;
          return <button key={server.id} onClick={() => void handleSwitchServer(server)} disabled={isSwitching}>
                  <div><PiLogo size={10} color={isDark ? '#1a1a1a' : '#fff'} /></div>
                  <div className={"block"}>
                    <span>{server.name}</span>
                    <span>{server.address}</span>
                  </div>
                  {isActive && <Check size={14} color="#34C759" strokeWidth={2.5} />}
                </button>;
        })}
          </div>
          <div>
            <button onClick={() => {
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
