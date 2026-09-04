import { Modal, Platform, Pressable } from 'react-native';
import { Input, Spinner, Text, View } from 'tamagui';
import { AlertCircle, Check, Wifi, X } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { QrScannerScanPanel } from './scan-panel';
import { styles } from './styles';
import { useQrScannerController } from '../../hooks/use-qr-scanner-controller';
import type { QrScannerProps } from './types';

export function QrScanner({ visible, onClose }: QrScannerProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const textMuted = isDark ? '#cdc8c5' : '#888';
  const cardBg = isDark ? '#1e1e1e' : '#FFFFFF';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? '#2a2a2a' : '#F6F6F6';
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
  } = useQrScannerController({ visible, onClose });
  const overlayBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)';
  const modalProps = { visible, transparent: true as const, onRequestClose: handleClose };

  if (step === 'pairing') {
    return (
      <Modal {...modalProps} animationType="fade">
        <Pressable style={[styles.overlay, { backgroundColor: overlayBg }]} onPress={handleClose} accessibilityLabel="关闭配对弹窗">
          <Pressable style={[styles.card, { backgroundColor: cardBg, borderColor }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.statusCenter}>
              <Spinner size="large" color={textPrimary} />
              <Text style={[styles.statusTitle, { color: textPrimary }]}>Connecting to AiJee</Text>
              <Text style={[styles.statusDesc, { color: textMuted }]}>Completing secure pairing…</Text>
            </View>
            <Pressable onPress={handleClose} style={[styles.cancelBtn, { borderColor }]}>
              <Text style={[styles.cancelBtnText, { color: textMuted }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  if (step === 'done') {
    return (
      <Modal {...modalProps} animationType="fade">
        <Pressable style={[styles.overlay, { backgroundColor: overlayBg }]} onPress={handleClose} accessibilityLabel="关闭配对成功弹窗">
          <Pressable style={[styles.card, { backgroundColor: cardBg, borderColor }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.statusCenter}>
              <View style={[styles.successCircle, { backgroundColor: isDark ? '#30D158' : '#34C759' }]}>
                <Check size={28} color="#fff" strokeWidth={2.5} />
              </View>
              <Text style={[styles.statusTitle, { color: textPrimary }]}>Connected</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  if (step === 'error') {
    return (
      <Modal {...modalProps} animationType="fade">
        <Pressable style={[styles.overlay, { backgroundColor: overlayBg }]} onPress={handleClose} accessibilityLabel="关闭配对失败弹窗">
          <Pressable style={[styles.card, { backgroundColor: cardBg, borderColor }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.statusCenter}>
              <View style={[styles.errorCircle, { backgroundColor: isDark ? '#FF453A' : '#FF3B30' }]}>
                <AlertCircle size={28} color="#fff" strokeWidth={2} />
              </View>
              <Text style={[styles.statusTitle, { color: textPrimary }]}>Pairing Failed</Text>
              <Text style={[styles.statusDesc, { color: textMuted }]}>{error}</Text>
            </View>
            <View style={styles.errorActions}>
              <Pressable onPress={reset} style={[styles.retryBtn, { backgroundColor: isDark ? '#fefdfd' : '#1a1a1a' }]}>
                <Text style={[styles.retryBtnText, { color: isDark ? '#1a1a1a' : '#fff' }]}>Try Again</Text>
              </Pressable>
              <Pressable onPress={handleClose} style={[styles.cancelBtn, { borderColor }]}>
                <Text style={[styles.cancelBtnText, { color: textMuted }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  if (step === 'pick-ip' && connectParams) {
    return (
      <Modal {...modalProps} animationType="fade">
        <Pressable style={[styles.overlay, { backgroundColor: overlayBg }]} onPress={handleClose} accessibilityLabel="关闭网络选择弹窗">
          <Pressable style={[styles.card, { backgroundColor: cardBg, borderColor }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Select Network</Text>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <X size={18} color={textMuted} strokeWidth={1.8} />
              </Pressable>
            </View>
            <Text style={[styles.cardSubtitle, { color: textMuted }]}>
              {connectParams.hostname
                ? `"${connectParams.hostname}" is available on multiple addresses:`
                : 'Multiple addresses found:'}
            </Text>
            <View style={styles.ipList}>
              {connectParams.ips.map((ip) => (
                <Pressable
                  key={ip}
                  onPress={() => handleSelectIp(ip)}
                  style={({ pressed }) => [
                    styles.ipRow,
                    {
                      borderColor,
                      backgroundColor: pressed ? (isDark ? '#2a2a2a' : '#F6F6F6') : 'transparent',
                    },
                  ]}
                >
                  <Wifi size={16} color={textMuted} strokeWidth={1.8} />
                  <View style={styles.ipInfo}>
                    <Text style={[styles.ipText, { color: textPrimary }]}>{ip}</Text>
                    <Text style={[styles.ipPort, { color: textMuted }]}>Port {connectParams.port}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal {...modalProps} animationType="fade">
      <Pressable style={[styles.overlay, { backgroundColor: overlayBg }]} onPress={handleClose} accessibilityLabel="关闭扫码弹窗">
        <Pressable style={[styles.card, styles.scannerCard, { backgroundColor: cardBg, borderColor }]} onPress={(event) => event.stopPropagation()}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Scan QR Code</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <X size={18} color={textMuted} strokeWidth={1.8} />
            </Pressable>
          </View>
          <QrScannerScanPanel
            visible={visible}
            scanned={scanned}
            isDark={isDark}
            textMuted={textMuted}
            onBarcodeData={handleBarCodeScanned}
          />
          <View style={styles.manualSection}>
            <Text style={[styles.manualLabel, { color: textMuted }]}>
              {Platform.OS === 'web' ? 'Paste connect URL' : 'Or paste URL manually'}
            </Text>
            <View style={styles.manualRow}>
              <Input
                style={[styles.manualInput, { backgroundColor: inputBg, color: textPrimary, borderColor }]}
                value={manualUrl}
                onChangeText={handleManualUrlChange}
                placeholder="http://设备地址/?k=授权码"
                placeholderTextColor={isDark ? '#666' : '#bbb'}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={handleManualSubmit}
                style={[styles.manualBtn, { backgroundColor: isDark ? '#fefdfd' : '#1a1a1a' }, !manualUrl.trim() && { opacity: 0.4 }]}
                disabled={!manualUrl.trim()}
              >
                <Text style={[styles.manualBtnText, { color: isDark ? '#1a1a1a' : '#fff' }]}>Connect</Text>
              </Pressable>
            </View>
          </View>
          {error && <Text style={[styles.errorText, { color: isDark ? '#FF453A' : '#FF3B30' }]}>{error}</Text>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
