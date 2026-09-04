import { type ReactNode, useCallback } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, Camera, Check, ChevronRight, Link2, QrCode, Wifi } from 'lucide-react-native';
import { Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { QrScannerScanPanel } from '@/features/servers/components/qr-scanner/scan-panel';
import { useQrScannerController } from '@/features/servers/hooks/use-qr-scanner-controller';
import { mobileLayout, mobileRadius } from '../styles/tokens';

export default function ScanConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeTokens();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const onRouteClose = useCallback(() => router.replace('/'), [router]);
  const controller = useQrScannerController({ visible: true, onClose: onRouteClose });
  const {
    step,
    scanned,
    connectParams,
    manualUrl,
    error,
    handleManualUrlChange,
    reset,
    handleClose,
    handleBarCodeScanned,
    handleManualSubmit,
    handleSelectIp,
  } = controller;

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="返回"
              accessibilityRole="button"
              onPress={handleClose}
              style={({ pressed }) => [
                styles.headerButton,
                { borderColor: colors.borderStrong, backgroundColor: colors.surfaceRaised },
                pressed && styles.pressed,
              ]}
            >
              <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: colors.textTertiary }]}>AIJEE DEVICE</Text>
              <Text style={[styles.title, { color: colors.text }]}>连接设备</Text>
            </View>
            <View style={[styles.securePill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
              <View style={[styles.secureDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.secureText, { color: colors.textSecondary }]}>安全</Text>
            </View>
          </View>

          {step === 'scan' && (
            <>
              <View style={[styles.hero, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
                <View style={styles.heroHeading}>
                  <View style={[styles.heroIcon, { backgroundColor: colors.accent }]}>
                    <QrCode color={colors.onAccent} size={21} strokeWidth={2} />
                  </View>
                  <View style={styles.heroCopy}>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>扫描授权二维码</Text>
                    <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>在 AiJee 设备端打开连接面板</Text>
                  </View>
                </View>
                <View style={[styles.scanner, { borderColor: colors.borderStrong }]}>
                  <QrScannerScanPanel
                    visible
                    scanned={scanned}
                    isDark={isDark}
                    textMuted={colors.textSecondary}
                    onBarcodeData={handleBarCodeScanned}
                  />
                </View>
                <View style={styles.tip}>
                  <Camera color={colors.textTertiary} size={16} strokeWidth={1.8} />
                  <Text style={[styles.tipText, { color: colors.textTertiary }]}>将二维码放入取景框内，自动完成配对</Text>
                </View>
              </View>

              <View style={styles.manualSection}>
                <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>或使用连接地址</Text>
                <View style={[styles.manualCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
                  <Link2 color={colors.textTertiary} size={18} strokeWidth={1.8} />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={handleManualUrlChange}
                    placeholder="粘贴设备连接地址"
                    placeholderTextColor={colors.textTertiary}
                    style={[styles.manualInput, { color: colors.text }]}
                    value={manualUrl}
                  />
                  <Pressable
                    accessibilityLabel="连接设备"
                    accessibilityRole="button"
                    disabled={!manualUrl.trim()}
                    onPress={handleManualSubmit}
                    style={({ pressed }) => [
                      styles.submitButton,
                      { backgroundColor: colors.accent, opacity: manualUrl.trim() ? 1 : 0.35 },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ChevronRight color={colors.onAccent} size={20} strokeWidth={2} />
                  </Pressable>
                </View>
                <Text style={[styles.helper, { color: colors.textTertiary }]}>连接地址只用于本次授权，令牌会安全保存在本机。</Text>
              </View>
              {error ? <InlineError color={colors.destructive} message={error} /> : null}
            </>
          )}

          {step === 'pick-ip' && connectParams ? (
            <NetworkPicker
              colors={colors}
              hostname={connectParams.hostname}
              ips={connectParams.ips}
              onCancel={handleClose}
              onSelect={handleSelectIp}
              port={connectParams.port}
            />
          ) : null}

          {step === 'pairing' ? (
            <StatusCard
              colors={colors}
              description="正在完成安全授权，请稍候。"
              icon={<ActivityIndicator color={colors.accent} size="large" />}
              primaryLabel="取消"
              onPrimaryPress={handleClose}
              title="正在连接"
            />
          ) : null}

          {step === 'done' ? (
            <StatusCard
              colors={colors}
              description="设备已准备好，正在打开工作区。"
              icon={<Check color={colors.onAccent} size={28} strokeWidth={2.4} />}
              iconBackground={colors.success}
              title="连接成功"
            />
          ) : null}

          {step === 'error' ? (
            <StatusCard
              colors={colors}
              description={error ?? '授权失败，请刷新设备端二维码后重试。'}
              icon={<AlertCircle color={colors.onAccent} size={27} strokeWidth={2} />}
              iconBackground={colors.destructive}
              primaryLabel="重新扫描"
              onPrimaryPress={reset}
              secondaryLabel="返回"
              onSecondaryPress={handleClose}
              title="连接失败"
            />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InlineError({ color, message }: { color: string; message: string }) {
  return (
    <View style={styles.inlineError}>
      <AlertCircle color={color} size={16} strokeWidth={2} />
      <Text style={[styles.inlineErrorText, { color }]}>{message}</Text>
    </View>
  );
}

function NetworkPicker({
  colors,
  hostname,
  ips,
  port,
  onSelect,
  onCancel,
}: {
  colors: ReturnType<typeof useThemeTokens>;
  hostname: string;
  ips: string[];
  port: string;
  onSelect: (ip: string) => void;
  onCancel: () => void;
}) {
  return (
    <View style={[styles.stateCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
      <View style={[styles.stateIcon, { backgroundColor: colors.accent }]}>
        <Wifi color={colors.onAccent} size={24} strokeWidth={1.8} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.text }]}>选择网络</Text>
      <Text style={[styles.stateDescription, { color: colors.textSecondary }]}>选择{hostname || '设备'}当前可用的地址。</Text>
      <View style={styles.ipList}>
        {ips.map((ip) => (
          <Pressable
            key={ip}
            onPress={() => onSelect(ip)}
            style={({ pressed }) => [styles.ipRow, { borderColor: colors.borderStrong }, pressed && { backgroundColor: colors.border }]}
          >
            <Wifi color={colors.textSecondary} size={17} strokeWidth={1.8} />
            <View style={styles.ipCopy}>
              <Text style={[styles.ipText, { color: colors.text }]}>{ip}</Text>
              <Text style={[styles.ipPort, { color: colors.textTertiary }]}>端口 {port}</Text>
            </View>
            <ChevronRight color={colors.textTertiary} size={18} strokeWidth={1.8} />
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onCancel} style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.borderStrong }, pressed && styles.pressed]}>
        <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>返回扫码</Text>
      </Pressable>
    </View>
  );
}

function StatusCard({
  colors,
  icon,
  iconBackground,
  title,
  description,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}: {
  colors: ReturnType<typeof useThemeTokens>;
  icon: ReactNode;
  iconBackground?: string;
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}) {
  return (
    <View style={[styles.stateCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
      <View style={[styles.stateIcon, iconBackground ? { backgroundColor: iconBackground } : styles.stateIconPlain]}>{icon}</View>
      <Text style={[styles.stateTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.stateDescription, { color: colors.textSecondary }]}>{description}</Text>
      {primaryLabel && onPrimaryPress ? (
        <Pressable onPress={onPrimaryPress} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.accent }, pressed && styles.pressed]}>
          <Text style={[styles.primaryButtonText, { color: colors.onAccent }]}>{primaryLabel}</Text>
        </Pressable>
      ) : null}
      {secondaryLabel && onSecondaryPress ? (
        <Pressable onPress={onSecondaryPress} style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.borderStrong }, pressed && styles.pressed]}>
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: mobileLayout.pageHorizontal, paddingTop: mobileLayout.pageTop, gap: mobileLayout.sectionGap },
  header: { minHeight: mobileLayout.headerButton, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerButton: { width: mobileLayout.headerButton, height: mobileLayout.headerButton, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: mobileRadius.control },
  headerCopy: { flex: 1, gap: 1 },
  eyebrow: { fontFamily: Fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.2 },
  title: { fontFamily: Fonts.sansSemiBold, fontSize: 22, lineHeight: 28 },
  securePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderRadius: mobileRadius.pill },
  secureDot: { width: 6, height: 6, borderRadius: 3 },
  secureText: { fontFamily: Fonts.sansMedium, fontSize: 12 },
  hero: { borderWidth: 1, borderRadius: mobileRadius.card, padding: 14, gap: 14 },
  heroHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  heroIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  heroCopy: { flex: 1, gap: 2 },
  heroTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 17 },
  heroDescription: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  scanner: { height: mobileLayout.cameraHeight, overflow: 'hidden', borderWidth: 1, borderRadius: 18, backgroundColor: '#0A0A0B' },
  tip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  tipText: { fontFamily: Fonts.sans, fontSize: 12 },
  manualSection: { gap: 10 },
  sectionLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.4 },
  manualCard: { minHeight: mobileLayout.controlHeight, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 7, borderWidth: 1, borderRadius: mobileRadius.control },
  manualInput: { flex: 1, height: mobileLayout.controlHeight - 2, paddingHorizontal: 0, fontFamily: Fonts.sans, fontSize: 14 },
  submitButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  helper: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 17, paddingHorizontal: 2 },
  inlineError: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 13, borderRadius: 14, backgroundColor: 'rgba(255,69,58,0.10)' },
  inlineErrorText: { flex: 1, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  stateCard: { alignItems: 'center', borderWidth: 1, borderRadius: mobileRadius.card, padding: 24, gap: 12 },
  stateIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  stateIconPlain: { backgroundColor: 'transparent' },
  stateTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 20, marginTop: 2 },
  stateDescription: { maxWidth: 280, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  ipList: { width: '100%', gap: 8, marginTop: 4 },
  ipRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, borderWidth: 1, borderRadius: 16 },
  ipCopy: { flex: 1, gap: 2 },
  ipText: { fontFamily: Fonts.sansMedium, fontSize: 14 },
  ipPort: { fontFamily: Fonts.sans, fontSize: 12 },
  primaryButton: { width: '100%', minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: mobileRadius.control, marginTop: 4 },
  primaryButtonText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  secondaryButton: { width: '100%', minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: mobileRadius.control },
  secondaryButtonText: { fontFamily: Fonts.sansMedium, fontSize: 14 },
  pressed: { opacity: 0.68 },
});
