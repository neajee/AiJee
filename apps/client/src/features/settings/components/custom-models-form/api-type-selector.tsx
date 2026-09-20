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
  return <div className={"block"}>
      <span className={"  text-text-secondary"}>
        API 类型
      </span>
      <div className={"block"}>
        {API_TYPES.map(item => {
        const isActive = value === item.value;
        return <button key={item.value} onClick={() => onChange(item.value)}>
              <span>
                {item.label}
              </span>
            </button>;
      })}
      </div>
    </div>;
}
