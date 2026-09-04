import { type ReactNode } from 'react';
import { ScrollView, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useSettingsContentStyle,
  useSettingsPalette,
  useSettingsPhoneLayout,
} from '@/components/settings-surface';
import { styles } from './styles';

export function SettingsScroll({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const palette = useSettingsPalette();
  const phone = useSettingsPhoneLayout();
  const contentStyle = useSettingsContentStyle(insets.bottom);

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          phone
            ? contentStyle
            : {
                ...contentStyle,
                maxWidth: '100%',
                gap: 0,
                paddingLeft: 0, paddingRight: 0,
                paddingTop: 0,
                paddingBottom: 0,
                flexGrow: 1,
              }
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
