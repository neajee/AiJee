import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mic } from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import {
  useSettingsHeadingVisible,
  useSettingsPalette,
  useSettingsPhoneLayout,
} from '../../../settings/components/settings-list';
import { useSpeechSettingsStore } from '../../store';

type SpeechStyles = typeof webStyles;

export function SpeechSettings({ isNative }: { isNative?: boolean }) {
  const phone = useSettingsPhoneLayout();
  // `isNative` is kept as an escape hatch, but density now follows the viewport
  // so mobile web renders the same roomy layout as the native builds.
  const roomy = isNative ?? phone;
  const styles = roomy ? nativeStyles : webStyles;
  const p = useSettingsPalette();
  const headingVisible = useSettingsHeadingVisible();

  const { loaded, load } = useSpeechSettingsStore();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <View style={styles.section}>
      {headingVisible ? (
        <View style={styles.sectionHeader}>
          <Mic size={roomy ? 15 : 12} color={p.textSecondary} strokeWidth={1.8} />
          <Text style={[styles.sectionTitle, { color: p.textSecondary }]}>语音识别</Text>
        </View>
      ) : null}

      <View
        style={[styles.card, { backgroundColor: p.card, borderColor: p.separator }]}
      >
        <Text style={[styles.modeLabel, { color: p.text }]}>内置语音</Text>
        <Text style={[styles.modeDesc, { color: p.textTertiary }]}>使用浏览器或设备提供的语音识别能力</Text>
      </View>
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
  modeLabel: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
  modeDesc: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    marginTop: 2,
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
  modeLabel: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
  modeDesc: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
});
