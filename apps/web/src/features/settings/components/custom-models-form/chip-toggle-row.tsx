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
  options
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
  return <div className="flex flex-col gap-1.5">
      <span className="text-[var(--desc-size)] text-text-secondary">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(item => <button key={item.key} onClick={item.locked ? undefined : item.onToggle} disabled={item.locked} role="checkbox" aria-checked={item.active} className={`flex h-7 items-center rounded-md border px-2.5 text-caption disabled:opacity-60 ${item.active ? 'border-border-strong bg-active text-foreground' : 'border-border text-text-secondary hover:bg-hover'}`}>
            <span>{item.label}</span>
          </button>)}
      </div>
      {hint ? <span className="text-meta text-text-tertiary">{hint}</span> : null}
    </div>;
}
