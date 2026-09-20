import type React from "react";
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
  style?: React.CSSProperties;
}
export function Select<T extends string = string>({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  compact = false,
  style
}: SelectProps<T>) {
  const tokens = useThemeTokens();
  const textColor = tokens.text;
  const bg = tokens.surfaceRaised;
  const border = tokens.borderStrong;
  const mutedColor = tokens.textTertiary;
  if (true) {
    return <div>
        <select value={value} disabled={disabled} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as T)} className="flex flex-col">
          {placeholder && <option value="" disabled>
              {placeholder}
            </option>}
          {options.map(opt => <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>)}
        </select>
      </div>;
  }
  return <div>
      <div>
        </div>
    </div>;
}
const wrapperStyle = {
  position: "relative"
} as const;
const nativeTriggerStyle = {
  borderWidth: 0.633,
  borderRadius: 6,
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 8,
  paddingBottom: 8
} as const;
const disabledStyle = {
  opacity: 0.5
} as const;
