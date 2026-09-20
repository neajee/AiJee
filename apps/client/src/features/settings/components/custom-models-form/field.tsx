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
  return <div className={""}>
      <span className={"" + " " + ""}>
        {label}
      </span>
      <input className={"" + " " + "" + " " + (mono ? "font-mono" : "")} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} autoFocus={autoFocus} />
    </div>;
}
