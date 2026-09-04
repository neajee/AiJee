import { type ReactNode } from 'react';
import { Pressable } from 'react-native';
import { ScrollView, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import {
  SettingsHeadingProvider,
  SettingsLayoutProvider,
  useSettingsContentStyle,
  useSettingsMetrics,
  useSettingsPalette,
  useSettingsPhoneLayout,
} from '@/components/settings-surface';
import { type SettingsSection } from '../../sections';
import { SettingsScroll } from './settings-scroll';
import { desktopStyles, styles } from './styles';

export function SettingsDetailScreen({
  section,
  isDark,
  onBack,
}: {
  section: SettingsSection;
  isDark: boolean;
  onBack: () => void;
}) {
  const phone = useSettingsPhoneLayout();
  const Component = section.Component;

  return (
    <SettingsLayoutProvider phone={phone}>
      {phone ? (
        <SettingsDetailChrome title={section.title} onBack={onBack}>
          <SettingsHeadingProvider visible={false}>
            <Component isDark={isDark} />
          </SettingsHeadingProvider>
        </SettingsDetailChrome>
      ) : (
        <SettingsScroll>
          <SettingsDesktopSection section={section} isDark={isDark} />
        </SettingsScroll>
      )}
    </SettingsLayoutProvider>
  );
}

function SettingsDesktopSection({ section, isDark }: { section: SettingsSection; isDark: boolean }) {
  const metrics = useSettingsMetrics();
  const palette = useSettingsPalette();
  const Component = section.Component;
  const inset = metrics.gutter + 6;

  return (
    <View style={desktopStyles.detail}>
      <View style={[desktopStyles.detailHeader, { borderBottomColor: palette.separator, paddingLeft: inset , paddingRight: inset }]}>
        <View style={desktopStyles.detailHeaderCopy}>
          <Text style={[desktopStyles.detailTitle, { color: palette.text }]}>{section.title}</Text>
        </View>
      </View>
      <ScrollView
        style={desktopStyles.detailScroll}
        contentContainerStyle={{ paddingLeft: inset, paddingRight: inset, paddingTop: metrics.groupGap, paddingBottom: 32, gap: metrics.groupGap }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeadingProvider visible={false}>
          <Component isDark={isDark} />
        </SettingsHeadingProvider>
      </ScrollView>
    </View>
  );
}

function SettingsDetailChrome({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const metrics = useSettingsMetrics();
  const palette = useSettingsPalette();
  const contentStyle = useSettingsContentStyle(insets.bottom);

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]}>
      <View style={[styles.navBar, { borderBottomColor: palette.separator }]}>
        <View style={[styles.navBarInner, { paddingLeft: metrics.gutter - 6, paddingRight: metrics.gutter - 6, maxWidth: metrics.contentMaxWidth, minHeight: metrics.rowMinHeight + 4 }]}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="返回设置"
            hitSlop={8}
            style={({ pressed }) => [styles.backBtn, { width: metrics.rowMinHeight - 8, height: metrics.rowMinHeight - 8 }, pressed && { opacity: 0.55 }]}
          >
            <ChevronLeft size={metrics.chevronSize + 6} color={palette.text} strokeWidth={2} />
          </Pressable>
          <Text style={[styles.navTitle, { fontSize: metrics.labelSize + 1, color: palette.text }]} numberOfLines={1}>{title}</Text>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </View>
  );
}
