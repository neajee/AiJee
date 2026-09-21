import { Search, X } from 'lucide-react';
import type { MarketplacePackage } from '@aijee/client-sdk';
import { useSettingsPalette } from '@/components/settings-surface';

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
  return <div className="flex items-center gap-0.5 rounded-[calc(var(--tile-radius)+2px)] bg-active p-0.5">
      {options.map(option => {
      const active = option.value === value;
      return <button key={option.value} onClick={() => onChange(option.value)} role="button" aria-label={option.label} className={`inline-flex items-center justify-center rounded-[var(--tile-radius)] border px-3 py-[5px] transition-colors active:opacity-60 ${active ? 'border-border bg-card' : 'border-transparent hover:bg-hover'}`}>
            <span className={`font-sans text-[var(--desc-size)] ${active ? 'font-medium text-foreground' : 'text-text-tertiary'}`}>
              {option.label}
            </span>
          </button>;
    })}
    </div>;
}
export function SearchField({
  value,
  onChange,
  onSubmit
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const p = useSettingsPalette();
  return <div className="flex h-[34px] items-center gap-2 rounded-[var(--tile-radius)] border border-border bg-active px-2.5">
      <Search size={14} color={p.textTertiary} strokeWidth={1.8} />
      <input value={value} onChange={event => onChange(event.target.value)} onKeyDown={event => event.key === "Enter" && onSubmit()} placeholder="搜索插件名称或关键词" aria-label="搜索插件" className="h-full min-w-0 flex-1 bg-transparent font-sans text-[var(--value-size)] text-foreground outline-none placeholder:text-text-tertiary" />
      {value ? <button onClick={() => onChange('')} role="button" aria-label="清空搜索" className="inline-flex items-center hover:opacity-60">
          <X size={13} color={p.textTertiary} strokeWidth={2} />
        </button> : null}
    </div>;
}
export function Chip({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return <button onClick={onClick} role="button" aria-label={label} className={`inline-flex items-center rounded-md border px-2.5 py-[5px] transition-colors active:opacity-60 ${active ? 'border-border-strong bg-active' : 'border-border hover:bg-hover'}`}>
      <span className={`font-sans text-[var(--desc-size)] ${active ? 'font-medium text-foreground' : 'text-text-secondary'}`}>
        {label}
      </span>
    </button>;
}

// ─── List ─────────────────────────────────────────────────────

export function PackageCard({
  pkg,
  single,
  onClick
}: {
  pkg: MarketplacePackage;
  /** Narrow viewport: one card per row instead of a wrapping grid. */
  single: boolean;
  onClick: () => void;
}) {
  return <button onClick={onClick} role="button" aria-label={`${pkg.name} 详情`} className={`flex flex-col gap-2.5 rounded-[var(--card-radius)] border border-border bg-card p-[var(--gutter)] text-left transition-colors hover:border-border-strong hover:bg-hover active:opacity-75 ${single ? 'w-full' : 'grow min-w-[340px] max-w-[560px] basis-[340px]'} min-h-[132px]`}>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-sans text-[var(--label-size)] font-medium text-foreground">
          {pkg.name}
        </span>
        <span className="shrink-0 font-mono text-meta text-text-tertiary">v{pkg.version}</span>
      </div>
      <span className="font-sans text-[var(--desc-size)] leading-[18px] text-text-secondary">
        {pkg.description || '作者未提供介绍'}
      </span>
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-meta text-text-tertiary">
          {pkg.package_types.join(' · ') || 'npm'}
        </span>
        {pkg.downloads ? <span className="font-sans text-meta text-text-tertiary">
            {pkg.downloads.toLocaleString()} 次/周
          </span> : null}
      </div>
    </button>;
}
