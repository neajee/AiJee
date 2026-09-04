import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Link2, Palette, Bell, LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from 'tamagui';

import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useAppSettingsStore, type ThemeMode, type ThemePreset } from '@/features/settings/store';
import { useAuthStore } from '@/features/auth/store';
import { useServersStore } from '@/features/servers/store';
import { mobileLayout, mobileRadius } from '../styles/tokens';

const THEME_MODES: Array<{ label: string; value: ThemeMode }> = [
  { label: '系统', value: 'system' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
];

const THEME_PRESETS: Array<{ label: string; value: ThemePreset }> = [
  { label: 'Radix', value: 'radix' },
  { label: 'Codex', value: 'codex' },
  { label: 'Vercel', value: 'vercel' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeTokens();
  const settingsLoaded = useAppSettingsStore((state) => state.loaded);
  const loadSettings = useAppSettingsStore((state) => state.load);
  const themeMode = useAppSettingsStore((state) => state.themeMode);
  const themePreset = useAppSettingsStore((state) => state.themePreset);
  const pushNotifications = useAppSettingsStore((state) => state.pushNotifications);
  const soundEffects = useAppSettingsStore((state) => state.soundEffects);
  const updateSettings = useAppSettingsStore((state) => state.update);
  const activeServerId = useAuthStore((state) => state.activeServerId);
  const logoutFromServer = useAuthStore((state) => state.logoutFromServer);
  const server = useServersStore((state) => state.servers.find((item) => item.id === activeServerId));
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!settingsLoaded) void loadSettings();
  }, [loadSettings, settingsLoaded]);

  const disconnect = async () => {
    if (!activeServerId || disconnecting) return;
    setDisconnecting(true);
    try {
      await logoutFromServer(activeServerId);
      router.replace('/servers');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="返回项目列表" accessibilityRole="button" onPress={() => router.replace('/')} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }, pressed && styles.pressed]}>
            <ArrowLeft color={colors.text} size={19} strokeWidth={1.8} />
          </Pressable>
          <View style={styles.headerCopy}><Text style={[styles.eyebrow, { color: colors.textTertiary }]}>PREFERENCES</Text><Text style={[styles.title, { color: colors.text }]}>设置</Text></View>
        </View>

        <SettingSection icon={<Link2 color={colors.accent} size={18} strokeWidth={1.8} />} title="连接" colors={colors}>
          <View style={styles.connectionRow}>
            <View style={[styles.serverMark, { backgroundColor: colors.background }]}><View style={[styles.connectionDot, { backgroundColor: server ? colors.success : colors.textTertiary }]} /></View>
            <View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{server?.name ?? '未连接设备'}</Text><Text style={[styles.rowDescription, { color: colors.textTertiary }]}>{server?.address ?? '扫描二维码连接 AiJee 电脑'}</Text></View>
            <Pressable accessibilityLabel="更换连接设备" accessibilityRole="button" onPress={() => router.push('/servers')} style={({ pressed }) => [styles.smallAction, { borderColor: colors.borderStrong }, pressed && styles.pressed]}><Text style={[styles.smallActionText, { color: colors.textSecondary }]}>{server ? '更换' : '连接'}</Text></Pressable>
          </View>
          {server ? <Pressable accessibilityRole="button" disabled={disconnecting} onPress={() => void disconnect()} style={({ pressed }) => [styles.dangerRow, pressed && styles.pressed]}>{disconnecting ? <ActivityIndicator color={colors.destructive} /> : <LogOut color={colors.destructive} size={16} strokeWidth={1.8} />}<Text style={[styles.dangerText, { color: colors.destructive }]}>{disconnecting ? '正在断开…' : '断开当前设备'}</Text></Pressable> : null}
        </SettingSection>

        <SettingSection icon={<Palette color={colors.accent} size={18} strokeWidth={1.8} />} title="外观" colors={colors}>
          <OptionRow label="主题模式" description="跟随系统或固定为浅色/深色" colors={colors}>
            <OptionGroup colors={colors} options={THEME_MODES} value={themeMode} onChange={(value) => void updateSettings({ themeMode: value })} />
          </OptionRow>
          <OptionRow label="主题预设" description="只影响颜色与字体，不改变数据" colors={colors}>
            <OptionGroup colors={colors} options={THEME_PRESETS} value={themePreset} onChange={(value) => void updateSettings({ themePreset: value })} />
          </OptionRow>
        </SettingSection>

        <SettingSection icon={<Bell color={colors.accent} size={18} strokeWidth={1.8} />} title="通知" colors={colors}>
          <SwitchRow label="任务完成通知" description="工作区中的任务完成后提醒我" value={pushNotifications} onChange={(value) => void updateSettings({ pushNotifications: value })} colors={colors} />
          <SwitchRow label="声音反馈" description="发送与完成时播放轻提示音" value={soundEffects} onChange={(value) => void updateSettings({ soundEffects: value })} colors={colors} />
        </SettingSection>
      </ScrollView>
    </View>
  );
}

function SettingSection({ icon, title, colors, children }: { icon: ReactNode; title: string; colors: ReturnType<typeof useThemeTokens>; children: ReactNode }) {
  return <View style={styles.section}><View style={styles.sectionHeading}><View style={[styles.sectionIcon, { backgroundColor: colors.surfaceRaised }]}>{icon}</View><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text><ChevronRight color={colors.textTertiary} size={16} strokeWidth={1.7} /></View><View style={[styles.sectionCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>{children}</View></View>;
}

function OptionRow({ label, description, colors, children }: { label: string; description: string; colors: ReturnType<typeof useThemeTokens>; children: ReactNode }) {
  return <View style={styles.optionRow}><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text><Text style={[styles.rowDescription, { color: colors.textTertiary }]}>{description}</Text></View>{children}</View>;
}

function OptionGroup<T extends string>({ colors, options, value, onChange }: { colors: ReturnType<typeof useThemeTokens>; options: Array<{ label: string; value: T }>; value: T; onChange: (value: T) => void }) {
  return <View style={[styles.optionGroup, { backgroundColor: colors.background }]}>{options.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} style={({ pressed }) => [styles.option, { backgroundColor: option.value === value ? colors.accent : 'transparent' }, pressed && styles.pressed]}><Text style={[styles.optionText, { color: option.value === value ? colors.onAccent : colors.textSecondary }]}>{option.label}</Text></Pressable>)}</View>;
}

function SwitchRow({ label, description, value, onChange, colors }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void; colors: ReturnType<typeof useThemeTokens> }) {
  return <View style={styles.switchRow}><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text><Text style={[styles.rowDescription, { color: colors.textTertiary }]}>{description}</Text></View><Switch accessibilityLabel={label} onValueChange={onChange} thumbColor={value ? colors.onAccent : colors.textTertiary} trackColor={{ false: colors.borderStrong, true: colors.accent }} value={value} /> </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: mobileLayout.pageHorizontal, paddingTop: 10, gap: 25 },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14 },
  headerCopy: { gap: 1 },
  eyebrow: { fontFamily: Fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.2 },
  title: { fontFamily: Fonts.sansSemiBold, fontSize: 21, lineHeight: 27 },
  section: { gap: 10 },
  sectionHeading: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  sectionTitle: { flex: 1, fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  sectionCard: { paddingHorizontal: 14, borderWidth: 1, borderRadius: mobileRadius.card },
  connectionRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 11 },
  serverMark: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  connectionDot: { width: 9, height: 9, borderRadius: 5 },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 14, lineHeight: 20 },
  rowDescription: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  smallAction: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderRadius: 12 },
  smallActionText: { fontFamily: Fonts.sansMedium, fontSize: 12 },
  dangerRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.18)' },
  dangerText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  optionRow: { gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.16)' },
  optionGroup: { minHeight: 38, flexDirection: 'row', alignItems: 'center', padding: 3, borderRadius: 13 },
  option: { minHeight: 32, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 10 },
  optionText: { fontFamily: Fonts.sansMedium, fontSize: 12 },
  switchRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.16)' },
  pressed: { opacity: 0.68 },
});
