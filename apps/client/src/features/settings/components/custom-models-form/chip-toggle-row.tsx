import { toTailwind } from "@/styles/to-tailwind";
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
  return <div className={toTailwind(colors.s.field.container)}>
      <span className={toTailwind([colors.s.field.label, {
      color: colors.textMuted
    }])}>
        {label}
      </span>
      <div className={toTailwind(colors.s.api.row)}>
        {options.map(item => <button key={item.key} onClick={item.locked ? undefined : item.onToggle} disabled={item.locked} role="checkbox" accessibilityState={{
        checked: item.active,
        disabled: item.locked
      }} className={toTailwind([colors.s.api.chip, {
        backgroundColor: item.active ? colors.chipActiveBg : 'transparent',
        borderColor: item.active ? colors.chipActiveBorder : colors.chipBorder
      }, item.locked && {
        opacity: 0.6
      }])}>
            <span className={toTailwind([colors.s.api.chipText, {
          color: item.active ? colors.textPrimary : colors.textMuted
        }])}>
              {item.label}
            </span>
          </button>)}
      </div>
      {hint ? <span className={toTailwind([colors.s.field.label, {
      color: colors.placeholder
    }])}>
          {hint}
        </span> : null}
    </div>;
}
