import { Text, View } from 'tamagui';
import { Pressable } from 'react-native';
import { useColors } from '../../hooks/use-custom-models-theme';

// ─── Capability chips ─────────────────────────────────────────

/**
 * Multi-select chips reusing the API-type chip styling. Used for capabilities
 * pi reads from models.json but that had no editor before (input modalities,
 * reasoning), so they could previously only be set by hand-editing the file.
 */
export function ChipToggleRow({
  label,
  hint,
  options,
  colors,
}: {
  label: string;
  hint?: string;
  options: {
    key: string;
    label: string;
    active: boolean;
    locked?: boolean;
    onToggle: () => void;
  }[];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={colors.s.field.container}>
      <Text style={[colors.s.field.label, { color: colors.textMuted }]}>
        {label}
      </Text>
      <View style={colors.s.api.row}>
        {options.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.locked ? undefined : item.onToggle}
            disabled={item.locked}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.active, disabled: item.locked }}
            style={[
              colors.s.api.chip,
              {
                backgroundColor: item.active ? colors.chipActiveBg : 'transparent',
                borderColor: item.active
                  ? colors.chipActiveBorder
                  : colors.chipBorder,
              },
              item.locked && { opacity: 0.6 },
            ]}
          >
            <Text
              style={[
                colors.s.api.chipText,
                { color: item.active ? colors.textPrimary : colors.textMuted },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {hint ? (
        <Text style={[colors.s.field.label, { color: colors.placeholder }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
