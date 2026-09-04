import { Platform, type ViewStyle, type StyleProp } from "react-native";
import { View as TamaguiView } from "tamagui";

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
      <TamaguiView style={[wrapperStyle, style]}>
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
            appearance: "none",
            outline: "none",
            boxSizing: "border-box",
            minHeight: compact ? 28 : 36,
            paddingLeft: compact ? 8 : 10,
            paddingRight: compact ? 28 : 32,
            paddingTop: compact ? 5 : 8,
            paddingBottom: compact ? 5 : 8,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            backgroundImage: `linear-gradient(45deg, transparent 50%, ${mutedColor} 50%), linear-gradient(135deg, ${mutedColor} 50%, transparent 50%)`,
            backgroundPosition: "calc(100% - 13px) 12px, calc(100% - 9px) 12px",
            backgroundSize: "4px 4px, 4px 4px",
            backgroundRepeat: "no-repeat",
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
      </TamaguiView>
    );
  }

  return (
    <TamaguiView style={[wrapperStyle, style]}>
      <TamaguiView
        style={[
          nativeTriggerStyle,
          { backgroundColor: bg, borderColor: border },
          disabled && disabledStyle,
        ]}
      >
        {/* Native mobile: use Picker from @react-native-picker/picker if needed */}
      </TamaguiView>
    </TamaguiView>
  );
}

const wrapperStyle = {
    position: "relative",
  } as const;

const nativeTriggerStyle = {
    borderWidth: 0.633,
    borderRadius: 6,
    paddingLeft: 10, paddingRight: 10,
    paddingTop: 8, paddingBottom: 8,
  } as const;

const disabledStyle = {
    opacity: 0.5,
  } as const;
