import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

type LoadingSize = 'sm' | 'md' | 'lg';

interface MorphLoadingProps {
  size?: LoadingSize;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<LoadingSize, number> = { sm: 64, md: 96, lg: 128 };
const OFFSETS = [
  [[0, 0, 1, 0], [20, -20, 1.2, 50], [40, 0, 0.8, 25], [20, 20, 1.1, 75]],
  [[0, 0, 1, 0], [-20, -20, 1.3, 50], [-40, 0, 0.7, 25], [-20, 20, 1.2, 75]],
  [[0, 0, 1, 0], [-20, 20, 0.9, 100], [0, 40, 1.4, 0], [20, 20, 0.8, 50]],
  [[0, 0, 1, 0], [20, 20, 1.1, 25], [0, -40, 1.3, 100], [-20, -20, 0.9, 75]],
] as const;

function MorphBlock({ index, color, scale }: { index: number; color: string; scale: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2_000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const points = OFFSETS[index];
    const inputRange = [0, 0.25, 0.5, 0.75, 1];
    const values = <T extends number>(column: number) =>
      [...points.map((point) => point[column] as T), points[0][column] as T];
    return {
      borderRadius: `${interpolate(progress.value, inputRange, values(3))}%`,
      transform: [
        { translateX: interpolate(progress.value, inputRange, values(0)) * scale },
        { translateY: interpolate(progress.value, inputRange, values(1)) * scale },
        { scale: interpolate(progress.value, inputRange, values(2)) },
      ],
    };
  });

  return <Animated.View style={[styles.block, { backgroundColor: color }, animatedStyle]} />;
}

export default function MorphLoading({ size = 'md', style }: MorphLoadingProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const dimension = SIZES[size];
  const scale = dimension / SIZES.md;
  const color = colorScheme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <View style={[styles.container, { width: dimension, height: dimension }, style]}>
      {[0, 1, 2, 3].map((index) => (
        <MorphBlock key={index} index={index} color={color} scale={scale} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  block: { position: 'absolute', width: 16, height: 16 },
});
