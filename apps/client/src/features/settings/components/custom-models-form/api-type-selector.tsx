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
  return <div className={""}>
      <span className={"" + " " + ""}>
        API 类型
      </span>
      <div className={""}>
        {API_TYPES.map(item => {
        const isActive = value === item.value;
        return <button key={item.value} onClick={() => onChange(item.value)} className={"" + " " + ""}>
              <span className={"" + " " + ""}>
                {item.label}
              </span>
            </button>;
      })}
      </div>
    </div>;
}
