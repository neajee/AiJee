import { Pressable, Text, View } from 'react-native';
import { providerPageStyles } from '../../utils/custom-models-styles';
import { ProviderMark } from './provider-mark';
import type { ProviderRowProps } from './types';

export function ProviderRow({
  name,
  id,
  meta,
  connected,
  colors,
  onPress,
  trailing,
  disabled,
}: ProviderRowProps) {
  const content = (
    <>
      {connected ? <View style={[providerPageStyles.statusDot, { backgroundColor: colors.successColor }]} /> : null}
      <ProviderMark name={name} id={id} colors={colors} />
      <View style={providerPageStyles.rowCopy}>
        <Text numberOfLines={1} style={[providerPageStyles.rowName, { color: colors.textPrimary }]}>{name}</Text>
        {meta ? <Text numberOfLines={1} style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>{meta}</Text> : null}
      </View>
    </>
  );

  if (trailing) {
    return (
      <View style={[providerPageStyles.row, disabled && { opacity: 0.5 }]}>
        <Pressable
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={name}
          accessibilityState={{ disabled }}
          style={({ pressed, hovered, focused }: any) => [
            providerPageStyles.rowMain,
            (pressed || hovered || focused) && !disabled && { backgroundColor: colors.pressedBg },
          ]}
        >
          {content}
        </Pressable>
        {trailing}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled }}
      style={({ pressed, hovered, focused }: any) => [
        providerPageStyles.row,
        (pressed || hovered || focused) && !disabled && { backgroundColor: colors.pressedBg },
        disabled && { opacity: 0.5 },
      ]}
    >
      {content}
    </Pressable>
  );
}
