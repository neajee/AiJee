import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X, Plus } from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

export function TerminalPanel() {
  const colors = useThemeTokens();
  const surfaceBg = colors.background;
  const topBorder = colors.borderStrong;
  const tabDivider = colors.border;
  const activeTabBorder = colors.accent;
  const textPrimary = colors.text;
  const textMuted = colors.textTertiary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: surfaceBg,
          borderTopColor: topBorder,
        },
      ]}
    >
      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: tabDivider }]}>
        <View style={styles.tabBarLeft}>
          <View style={[styles.tab, { borderBottomColor: activeTabBorder }]}>
            <Text style={[styles.tabText, { color: textPrimary }]}>
              Terminal 1
            </Text>
            <Pressable style={styles.tabClose}>
              <X size={12} color={textMuted} strokeWidth={2} />
            </Pressable>
          </View>

          <Pressable style={styles.addTabButton}>
            <Plus size={18} color={textMuted} strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>

      {/* Terminal content */}
      <View style={styles.terminalContent}>
        <Text
          style={[
            styles.terminalLine,
            { color: textMuted, fontFamily: Fonts.mono },
          ]}
        >
          <Text style={{ color: colors.success }}>~</Text>{' '}
          <Text style={{ color: textPrimary }}>$</Text> _
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 240,
    borderTopWidth: 0.633,
  },
  tabBar: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 0.633,
    paddingHorizontal: 24,
  },
  tabBarLeft: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1.9,
    marginBottom: -0.633,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  tabClose: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTabButton: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  terminalLine: {
    fontSize: 13,
    lineHeight: 20,
  },
});
