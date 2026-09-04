import { Text, View } from 'tamagui';
import { Pressable } from 'react-native';
import { useColors } from '../../hooks/use-custom-models-theme';
import { API_TYPES } from './constants';

// ─── API Type Selector ────────────────────────────────────────

export function ApiTypeSelector({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={colors.s.field.container}>
      <Text style={[colors.s.field.label, { color: colors.textMuted }]}>
        API 类型
      </Text>
      <View style={colors.s.api.row}>
        {API_TYPES.map((item) => {
          const isActive = value === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              style={[
                colors.s.api.chip,
                {
                  backgroundColor: isActive ? colors.chipActiveBg : 'transparent',
                  borderColor: isActive
                    ? colors.chipActiveBorder
                    : colors.chipBorder,
                },
              ]}
            >
              <Text
                style={[
                  colors.s.api.chipText,
                  { color: isActive ? colors.textPrimary : colors.textMuted },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
