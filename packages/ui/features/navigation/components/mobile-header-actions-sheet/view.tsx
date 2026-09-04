import { Text, View } from 'tamagui';
import { Platform, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { styles } from './styles';
import type { MobileHeaderActionsSheetViewProps } from './types';

export function MobileHeaderActionsSheetView({
  visible,
  items,
  bottomInset,
  isDark,
  textPrimary,
  textSecondary,
  rowBorder,
  overlayColor,
  handleColor,
  sheetStyle,
  overlayStyle,
  panGesture,
  onDismiss,
}: MobileHeaderActionsSheetViewProps) {
  return (
    <View
      {...(Platform.OS !== 'web' ? { pointerEvents: visible ? 'auto' : 'none' } : {})}
      style={[styles.root, Platform.OS === 'web' && ({ pointerEvents: visible ? 'auto' : 'none' } as any)]}
    >
      <Animated.View style={[styles.overlay, { backgroundColor: overlayColor }, overlayStyle]}>
        <Pressable style={ABSOLUTE_FILL_STYLE} onPress={onDismiss} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF', paddingBottom: bottomInset + 12 }, sheetStyle]}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: handleColor }]} />
          </View>
        </GestureDetector>

        <View style={styles.header}>
          <Text style={[styles.title, { color: textPrimary }]}>More</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>Quick actions for this screen</Text>
        </View>

        <View style={styles.list}>
          {items.map((item, index) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [styles.row, { borderBottomColor: rowBorder }, index === items.length - 1 && styles.lastRow, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={styles.rowIcon}>{item.icon}</View>
              <Text style={[styles.rowLabel, { color: textPrimary }]} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
