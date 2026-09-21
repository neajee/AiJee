import { useColors } from '../../hooks/use-custom-models-theme';

// ─── Field ────────────────────────────────────────────────────

export function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
  autoFocus
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  colors: ReturnType<typeof useColors>;
  mono?: boolean;
  autoFocus?: boolean;
}) {
  return <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[var(--desc-size)] text-text-secondary">{label}</span>
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} autoFocus={autoFocus} className={`h-8 w-full min-w-0 rounded-md border border-border bg-background px-2.5 text-[var(--value-size)] text-foreground outline-none placeholder:text-text-tertiary focus:border-border-strong ${mono ? 'font-mono' : 'font-sans'}`} />
    </div>;
}
