import { useColors } from '../../hooks/use-custom-models-theme';
import { API_TYPES } from './constants';

// ─── API Type Selector ────────────────────────────────────────

export function ApiTypeSelector({
  value,
  onChange
}: {
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return <div className="flex flex-col gap-1.5">
      <span className="text-[var(--desc-size)] text-text-secondary">API 类型</span>
      <div className="flex flex-wrap gap-1.5">
        {API_TYPES.map(item => {
        const isActive = value === item.value;
        return <button key={item.value} onClick={() => onChange(item.value)} className={`flex h-7 items-center rounded-md border px-2.5 text-caption ${isActive ? 'border-border-strong bg-active text-foreground' : 'border-border text-text-secondary hover:bg-hover'}`}>
              <span>{item.label}</span>
            </button>;
      })}
      </div>
    </div>;
}
