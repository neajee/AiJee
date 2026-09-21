import type React from "react";
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
  return <select value={value} disabled={disabled} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as T)} style={style} className={`${compact ? 'h-7' : 'h-9'} max-w-full rounded-md border border-border bg-surface-raised px-2 text-caption text-foreground outline-none hover:bg-hover disabled:opacity-50`}>
      {placeholder && <option value="" disabled>
          {placeholder}
        </option>}
      {options.map(opt => <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>)}
    </select>;
}
