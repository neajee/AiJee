import { Check, ChevronDown, Settings } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { ScrollView, Text, View } from 'tamagui';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { PiLogo } from '@/components/pi-logo';
import { useServerSwitcherController } from '../../hooks/use-server-switcher-controller';
import { styles } from './styles';

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
    handleSwitchServer,
  } = useServerSwitcherController();
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const popoverBg = isDark ? '#252525' : '#FFFFFF';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const hoverBg = isDark ? '#333' : '#F5F5F5';
  const iconBg = isDark ? '#fefdfd' : '#1a1a1a';
  return (
    <View style={styles.root} {...({ 'data-server-popover': true } as any)}>
      <Pressable
        onPress={() => setPopoverVisible((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel="Switch server"
        style={({ pressed, hovered }: any) => [styles.trigger, (pressed || hovered) && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
      >
        <View style={[styles.serverIcon, { backgroundColor: iconBg }]}>
          <PiLogo size={14} color={isDark ? '#1a1a1a' : '#fff'} />
        </View>
        <Text style={[styles.serverName, { color: textPrimary }]} numberOfLines={1}>{activeServer?.name ?? 'No Server'}</Text>
        <ChevronDown size={12} color={textMuted} strokeWidth={2} />
      </Pressable>
      {popoverVisible && (
        <View style={[styles.popover, { backgroundColor: popoverBg, borderColor }]}>
          <View style={styles.popoverHeader}><Text style={[styles.popoverTitle, { color: textMuted }]}>Servers</Text></View>
          <ScrollView style={styles.popoverList} bounces={false}>
            {servers.map((server) => {
              const isActive = server.id === activeServerId;
              const isSwitching = server.id === switchingId;
              return (
                <Pressable
                  key={server.id}
                  onPress={() => void handleSwitchServer(server)}
                  disabled={isSwitching}
                  style={({ pressed, hovered }: any) => [
                    styles.popoverItem,
                    isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                    (pressed || hovered) && { backgroundColor: hoverBg },
                  ]}
                >
                  <View style={[styles.popoverItemIcon, { backgroundColor: iconBg }]}><PiLogo size={10} color={isDark ? '#1a1a1a' : '#fff'} /></View>
                  <View style={styles.popoverItemInfo}>
                    <Text style={[styles.popoverItemName, { color: textPrimary }]} numberOfLines={1}>{server.name}</Text>
                    <Text style={[styles.popoverItemAddress, { color: textMuted }]} numberOfLines={1}>{server.address}</Text>
                  </View>
                  {isActive && <Check size={14} color="#34C759" strokeWidth={2.5} />}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={[styles.popoverFooter, { borderTopColor: borderColor }]}>
            <Pressable
              onPress={() => { setPopoverVisible(false); router.push('/settings/servers'); }}
              style={({ pressed, hovered }: any) => [styles.popoverFooterBtn, (pressed || hovered) && { backgroundColor: hoverBg }]}
            >
              <Settings size={13} color={textMuted} strokeWidth={1.8} />
              <Text style={[styles.popoverFooterText, { color: textMuted }]}>管理服务器</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
