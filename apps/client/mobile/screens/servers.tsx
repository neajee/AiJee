import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, QrCode } from 'lucide-react-native';
import { Text, View } from 'tamagui';

import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { mobileRadius } from '../styles/tokens';

export default function MobileServersScreen() {
  const router = useRouter();
  const colors = useThemeTokens();
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <View style={[styles.logo, { backgroundColor: colors.text }]}><Text style={[styles.logoText, { color: colors.background }]}>▰</Text></View>
    <Text style={[styles.title, { color: colors.text }]}>欢迎使用 AiJee</Text>
    <Text style={[styles.description, { color: colors.textTertiary }]}>连接到运行 AiJee 的设备，{`\n`}使用设备授权后即可打开工作区。</Text>
    <View style={styles.actions}>
      <Pressable onPress={() => router.push('/scan-connect' as never)} style={({ pressed }) => [styles.outline, { borderColor: colors.borderStrong }, pressed && styles.pressed]}><QrCode color={colors.textSecondary} size={16} /><Text style={[styles.outlineText, { color: colors.text }]}>扫描授权码</Text></Pressable>
      <Pressable onPress={() => router.push('/scan-connect' as never)} style={({ pressed }) => [styles.primary, { backgroundColor: colors.text }, pressed && styles.pressed]}><Plus color={colors.background} size={17} /><Text style={[styles.primaryText, { color: colors.background }]}>添加服务器</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 20, marginBottom: 22 },
  logoText: { fontSize: 25, fontFamily: Fonts.sansSemiBold },
  title: { fontFamily: Fonts.sansSemiBold, fontSize: 24 },
  description: { marginTop: 10, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 26 },
  outline: { height: 42, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: mobileRadius.control },
  primary: { height: 42, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: mobileRadius.control },
  outlineText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  primaryText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  pressed: { opacity: 0.68 },
});
