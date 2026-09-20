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
  return <div className="flex flex-col">
      <span className={"  text-text-secondary"}>
        {label}
      </span>
      <input className={"  text-foreground bg-background border-border font-mono"} value={value} onChange={event => onChangeText(event.target.value)} placeholder={placeholder} autoFocus={autoFocus} />
    </div>;
}
