import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Mic, Globe, Key, Bot, Radio } from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import {
  SettingsSwitch,
  useSettingsHeadingVisible,
  useSettingsPalette,
  useSettingsPhoneLayout,
} from '../../../settings/components/settings-list';
import { useSpeechSettingsStore, SpeechMode } from '../../store';

type SpeechStyles = typeof webStyles;

export function SpeechSettings({ isNative }: { isNative?: boolean }) {
  const phone = useSettingsPhoneLayout();
  // `isNative` is kept as an escape hatch, but density now follows the viewport
  // so mobile web renders the same roomy layout as the native builds.
  const roomy = isNative ?? phone;
  const styles = roomy ? nativeStyles : webStyles;
  const p = useSettingsPalette();
  const headingVisible = useSettingsHeadingVisible();

  const { mode, apiBaseUrl, apiKey, model, useRealtimeWs, wsModel, loaded, load, update } =
    useSpeechSettingsStore();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const inputBg = p.tile;
  const activeBg = p.tile;

  const modes: { key: SpeechMode; label: string; desc: string }[] = [
    { key: 'builtin', label: '内置', desc: '浏览器/设备语音' },
    { key: 'api', label: 'API', desc: 'Whisper 或兼容服务' },
  ];

  return (
    <View style={styles.section}>
      {headingVisible ? (
        <View style={styles.sectionHeader}>
          <Mic size={roomy ? 15 : 12} color={p.textSecondary} strokeWidth={1.8} />
          <Text style={[styles.sectionTitle, { color: p.textSecondary }]}>语音识别</Text>
        </View>
      ) : null}

      {/* Mode selector */}
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.separator }]}>
        <Text style={[styles.fieldLabel, { color: p.textTertiary }]}>模式</Text>
        <View style={styles.modeRow}>
          {modes.map((m) => {
            const isActive = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => update({ mode: m.key })}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => [
                  styles.modeOption,
                  {
                    borderColor: isActive ? p.border : p.separator,
                    backgroundColor: isActive ? activeBg : 'transparent',
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.modeLabel, { color: isActive ? p.text : p.textSecondary }]}>
                  {m.label}
                </Text>
                <Text style={[styles.modeDesc, { color: p.textTertiary }]}>{m.desc}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* API Configuration */}
      {mode === 'api' && (
        <View style={[styles.card, { backgroundColor: p.card, borderColor: p.separator }]}>
          <FieldRow icon={Globe} label="接口地址" roomy={roomy} styles={styles}>
            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: p.separator }]}>
              <TextInput
                style={[styles.input, { color: p.text }]}
                value={apiBaseUrl}
                onChangeText={(v) => update({ apiBaseUrl: v })}
                placeholder="https://api.openai.com/v1"
                placeholderTextColor={p.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                accessibilityLabel="接口地址"
              />
            </View>
          </FieldRow>

          <FieldRow icon={Key} label="API 密钥" roomy={roomy} styles={styles}>
            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: p.separator }]}>
              <TextInput
                style={[styles.input, { color: p.text }]}
                value={apiKey}
                onChangeText={(v) => update({ apiKey: v })}
                placeholder="sk-..."
                placeholderTextColor={p.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                accessibilityLabel="API 密钥"
              />
            </View>
            <Text style={[styles.hint, { color: p.textTertiary }]}>密钥仅保存在本机</Text>
          </FieldRow>

          <FieldRow icon={Bot} label="模型" roomy={roomy} styles={styles}>
            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: p.separator }]}>
              <TextInput
                style={[styles.input, { color: p.text }]}
                value={model}
                onChangeText={(v) => update({ model: v })}
                placeholder="whisper-1"
                placeholderTextColor={p.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="模型"
              />
            </View>
          </FieldRow>

          {/* Realtime toggle */}
          <View style={[styles.toggleRow, { borderTopColor: p.separator }]}>
            <View style={styles.toggleInfo}>
              <Radio size={roomy ? 15 : 12} color={p.textTertiary} strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeLabel, { color: p.text }]}>实时流式转写</Text>
                <Text style={[styles.modeDesc, { color: p.textTertiary }]}>
                  通过 WebSocket 流式传输转写
                </Text>
              </View>
            </View>
            <SettingsSwitch
              value={useRealtimeWs}
              onValueChange={(v) => update({ useRealtimeWs: v })}
              accessibilityLabel="实时流式转写"
            />
          </View>

          {useRealtimeWs && (
            <FieldRow icon={Bot} label="实时模型" roomy={roomy} styles={styles} isLast>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: p.separator }]}>
                <TextInput
                  style={[styles.input, { color: p.text }]}
                  value={wsModel}
                  onChangeText={(v) => update({ wsModel: v })}
                  placeholder="gpt-4o-transcribe"
                  placeholderTextColor={p.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="实时模型"
                />
              </View>
            </FieldRow>
          )}
        </View>
      )}
    </View>
  );
}

function FieldRow({
  icon: Icon,
  label,
  roomy,
  styles,
  children,
}: {
  icon: React.ComponentType<any>;
  label: string;
  roomy: boolean;
  styles: SpeechStyles;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  const p = useSettingsPalette();
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Icon size={roomy ? 14 : 11} color={p.textTertiary} strokeWidth={1.8} />
        <Text style={[styles.fieldLabel, { color: p.textTertiary }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const webStyles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  card: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeOption: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modeLabel: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
  modeDesc: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
  field: {
    gap: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.sans,
    outlineStyle: 'none',
  } as any,
  hint: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    marginTop: 2,
    paddingLeft: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 8,
  },
  toggleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

const nativeStyles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeOption: {
    flex: 1,
    padding: 13,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  modeLabel: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
  modeDesc: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
  field: {
    gap: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // 44 keeps the field tappable and, on iOS Safari, ≥16px text avoids the
    // automatic zoom-on-focus that makes web forms feel non-native.
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.sans,
    outlineStyle: 'none',
  } as any,
  hint: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    marginTop: 2,
    paddingLeft: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    gap: 10,
    minHeight: 48,
  },
  toggleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
