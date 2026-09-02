import { Platform, StyleSheet, View, type ViewStyle, type StyleProp } from "react-native";

import { useThemeTokens } from "@/hooks/use-theme-tokens";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface SelectProps<T extends string = string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Select<T extends string = string>({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  compact = false,
  style,
}: SelectProps<T>) {
  const tokens = useThemeTokens();
  const textColor = tokens.text;
  const bg = tokens.surfaceRaised;
  const border = tokens.borderStrong;
  const mutedColor = tokens.textTertiary;

  if (Platform.OS === "web") {
    return (
      <View style={[styles.wrapper, style]}>
        <select
          value={value}
          disabled={disabled}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange(e.target.value as T)
          }
          style={{
            width: "100%",
            fontFamily: tokens.uiFont,
            fontSize: compact ? 12 : 13,
            color: value ? textColor : mutedColor,
            backgroundColor: bg,
            border: `0.633px solid ${border}`,
            borderRadius: 6,
            paddingLeft: compact ? 8 : 10,
            paddingRight: compact ? 8 : 10,
            paddingTop: compact ? 5 : 8,
            paddingBottom: compact ? 5 : 8,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          } as React.CSSProperties}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.nativeTrigger,
          { backgroundColor: bg, borderColor: border },
          disabled && styles.disabled,
        ]}
      >
        {/* Native mobile: use Picker from @react-native-picker/picker if needed */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  nativeTrigger: {
    borderWidth: 0.633,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
