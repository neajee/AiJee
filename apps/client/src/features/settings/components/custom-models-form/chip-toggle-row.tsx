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
  colors
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
  return <div className={"block"}>
      <span className={"  text-text-secondary"}>
        {label}
      </span>
      <div className={"block"}>
        {options.map(item => <button key={item.key} onClick={item.locked ? undefined : item.onToggle} disabled={item.locked} role="checkbox" accessibilityState={{
        checked: item.active,
        disabled: item.locked
      }} className={"  opacity-[0.6]"}>
            <span className={" "}>
              {item.label}
            </span>
          </button>)}
      </div>
      {hint ? <span className={"  text-muted-foreground"}>
          {hint}
        </span> : null}
    </div>;
}
