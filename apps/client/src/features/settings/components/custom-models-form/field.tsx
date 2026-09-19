import { toTailwind } from "@/styles/to-tailwind";
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
  autoFocus
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  colors: ReturnType<typeof useColors>;
  mono?: boolean;
  autoFocus?: boolean;
}) {
  return <div className={toTailwind(colors.s.field.container)}>
      <span className={toTailwind([colors.s.field.label, {
      color: colors.textMuted
    }])}>
        {label}
      </span>
      <input className={toTailwind([colors.s.field.input, {
      color: colors.textPrimary,
      backgroundColor: colors.inputBg,
      borderColor: colors.borderColor
    }, mono && {
      fontFamily: Fonts.mono
    }])} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} autoFocus={autoFocus} />
    </div>;
}
