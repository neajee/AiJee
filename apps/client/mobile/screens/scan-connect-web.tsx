import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useQrScannerController } from '@/features/servers/hooks/use-qr-scanner-controller';
import { mobileRadius } from '../styles/tokens';

export default function ScanConnectWebScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeTokens();
  const onClose = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/mobile-preview');
      return;
    }
    router.replace('/mobile-preview' as never);
  }, [router]);
  const controller = useQrScannerController({ baseUrl: typeof window !== 'undefined' ? window.location.origin : undefined, visible: true, onClose });
  const { manualUrl, error, handleManualUrlChange, handleManualSubmit } = controller;

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="返回" onPress={onClose} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }, pressed && styles.pressed]}><Text style={[styles.backSymbol, { color: colors.text }]}>‹</Text></Pressable>
        <Text style={[styles.title, { color: colors.text }]}>连接设备</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
        <View style={[styles.qrIcon, { backgroundColor: colors.accent }]}><Text style={[styles.qrSymbol, { color: colors.onAccent }]}>▦</Text></View>
        <Text style={[styles.cardTitle, { color: colors.text }]}>扫描授权二维码</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>真机可直接扫描二维码，网页预览请粘贴设备端生成的连接地址。</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
          <Text style={[styles.linkSymbol, { color: colors.textTertiary }]}>↗</Text>
          <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={handleManualUrlChange} placeholder="粘贴设备连接地址" placeholderTextColor={colors.textTertiary} style={[styles.input, { color: colors.text }]} value={manualUrl} />
          <Pressable accessibilityLabel="连接设备" disabled={!manualUrl.trim()} onPress={handleManualSubmit} style={({ pressed }) => [styles.submit, { backgroundColor: colors.accent, opacity: manualUrl.trim() ? 1 : 0.35 }, pressed && styles.pressed]}><Text style={[styles.submitText, { color: colors.onAccent }]}>连接</Text></Pressable>
        </View>
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      </View>
      {controller.step === 'pairing' ? <View style={styles.progress}><ActivityIndicator color={colors.accent} /><Text style={[styles.progressText, { color: colors.textSecondary }]}>正在连接设备…</Text></View> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14 },
  backSymbol: { fontFamily: Fonts.sans, fontSize: 28, lineHeight: 30 },
  headerSpacer: { width: 40 },
  title: { flex: 1, fontFamily: Fonts.sansSemiBold, fontSize: 19, textAlign: 'center' },
  card: { padding: 20, borderWidth: 1, borderRadius: mobileRadius.card, gap: 12 },
  qrIcon: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  qrSymbol: { fontFamily: Fonts.sansSemiBold, fontSize: 28 },
  cardTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 18 },
  description: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  inputRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 9, paddingLeft: 13, paddingRight: 6, borderWidth: 1, borderRadius: mobileRadius.control },
  linkSymbol: { fontFamily: Fonts.sans, fontSize: 18 },
  input: { flex: 1, minWidth: 0, padding: 0, fontFamily: Fonts.sans, fontSize: 13 },
  submit: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 12 },
  submitText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  error: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  progressText: { fontFamily: Fonts.sans, fontSize: 13 },
  pressed: { opacity: 0.68 },
});
