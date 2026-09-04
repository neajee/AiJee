import { Input, Text, View } from 'tamagui';
import { Fonts } from '@/constants/theme';
import { useColors } from '../../hooks/use-custom-models-theme';

// ─── Field ────────────────────────────────────────────────────

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  mono,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  colors: ReturnType<typeof useColors>;
  mono?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <View style={colors.s.field.container}>
      <Text style={[colors.s.field.label, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Input
        style={[
          colors.s.field.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.inputBg,
            borderColor: colors.borderColor,
          },
          mono && { fontFamily: Fonts.mono },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
      />
    </View>
  );
}
