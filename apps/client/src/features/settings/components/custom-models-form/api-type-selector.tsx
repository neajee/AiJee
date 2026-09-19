import { toTailwind } from "@/styles/to-tailwind";
import { useColors } from '../../hooks/use-custom-models-theme';
import { API_TYPES } from './constants';

// ─── API Type Selector ────────────────────────────────────────

export function ApiTypeSelector({
  value,
  onChange,
  colors
}: {
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return <div className={toTailwind(colors.s.field.container)}>
      <span className={toTailwind([colors.s.field.label, {
      color: colors.textMuted
    }])}>
        API 类型
      </span>
      <div className={toTailwind(colors.s.api.row)}>
        {API_TYPES.map(item => {
        const isActive = value === item.value;
        return <button key={item.value} onClick={() => onChange(item.value)} className={toTailwind([colors.s.api.chip, {
          backgroundColor: isActive ? colors.chipActiveBg : 'transparent',
          borderColor: isActive ? colors.chipActiveBorder : colors.chipBorder
        }])}>
              <span className={toTailwind([colors.s.api.chipText, {
            color: isActive ? colors.textPrimary : colors.textMuted
          }])}>
                {item.label}
              </span>
            </button>;
      })}
      </div>
    </div>;
}
