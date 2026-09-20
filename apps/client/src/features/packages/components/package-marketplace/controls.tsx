import { Search, X } from 'lucide-react';
import type { MarketplacePackage } from '@aijee/client-sdk';
import { Fonts } from '@/constants/theme';
import { useSettingsMetrics, useSettingsPalette } from '@/components/settings-surface';
import { CARD_MIN_WIDTH } from '../../utils/marketplace-constants';

// ─── Header controls ──────────────────────────────────────────

export function Segmented({
  options,
  value,
  onChange
}: {
  options: {
    value: string;
    label: string;
  }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <div className={"  rounded-none"}>
      {options.map(option => {
      const active = option.value === value;
      return <button key={option.value} onClick={() => onChange(option.value)} role="button" aria-label={option.label} className="inline-flex items-center">
            <span className={"text-[var(--desc-size)] font-sans"}>
              {option.label}
            </span>
          </button>;
    })}
    </div>;
}
export function SearchField({
  value,
  onChangeText,
  onSubmit
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <div className={"  rounded-[var(--tile-radius)]"}>
      <Search size={14} color={p.textTertiary} strokeWidth={1.8} />
      <input value={value} onChange={event => onChangeText(event.target.value)} onKeyDown={event => event.key === "Enter" && onSubmit(event)} placeholder="搜索插件名称或关键词" aria-label="搜索插件" className={"  text-[var(--value-size)]"} />
      {value ? <button onClick={() => onChangeText('')} role="button" aria-label="清空搜索" className="inline-flex items-center">
          <X size={13} color={p.textTertiary} strokeWidth={2} />
        </button> : null}
    </div>;
}
export function Chip({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <button onClick={onPress} role="button" aria-label={label} className="inline-flex items-center">
      <span className={"text-[var(--desc-size)] font-sans"}>
        {label}
      </span>
    </button>;
}

// ─── List ─────────────────────────────────────────────────────

export function PackageCard({
  pkg,
  single,
  onPress
}: {
  pkg: MarketplacePackage;
  /** Narrow viewport: one card per row instead of a wrapping grid. */
  single: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <button onClick={onPress} role="button" aria-label={`${pkg.name} 详情`} className="inline-flex items-center">
      <div className="flex flex-col">
        <span className={"  text-[var(--label-size)]"}>
          {pkg.name}
        </span>
        <span>v{pkg.version}</span>
      </div>
      <span className={"  text-[var(--desc-size)]"}>
        {pkg.description || '作者未提供介绍'}
      </span>
      <div className="flex flex-col">
        <span>
          {pkg.package_types.join(' · ') || 'npm'}
        </span>
        {pkg.downloads ? <span>
            {pkg.downloads.toLocaleString()} 次/周
          </span> : null}
      </div>
    </button>;
}
