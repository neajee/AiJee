import { ProviderMark } from './provider-mark';
import type { ProviderRowProps } from './component-types';
export function ProviderRow({
  name,
  id,
  meta,
  connected,
  colors,
  onClick,
  trailing,
  disabled
}: ProviderRowProps) {
  const content = <>
      {connected ? <span className="size-2 shrink-0 rounded-full bg-success" /> : null}
      <ProviderMark name={name} id={id} colors={colors} />
      {/* Name and meta share one line so connected and addable rows are the same
          height, with the meta kept on the smaller tier. */}
      <div className="flex min-w-0 flex-1 items-baseline gap-2 text-left">
        <span className="shrink-0 truncate text-[var(--label-size)] text-foreground">{name}</span>
        {meta ? <span className="min-w-0 truncate text-[var(--desc-size)] text-text-secondary">{meta}</span> : null}
      </div>
    </>;
  const rowClass = "flex min-h-[var(--row-min-height)] items-center gap-[var(--row-gap)] px-[var(--gutter)]";
  if (trailing) {
    return <div className={`${rowClass} hover:bg-hover`}>
        <button onClick={onClick} disabled={disabled} role="button" aria-label={name} className="flex min-w-0 flex-1 items-center gap-[var(--row-gap)] text-left disabled:opacity-50">
          {content}
        </button>
        <div className="flex shrink-0 items-center gap-1">{trailing}</div>
      </div>;
  }
  return <button onClick={onClick} disabled={disabled} role="button" aria-label={name} className={`${rowClass} w-full text-left hover:bg-hover disabled:opacity-50`}>
      {content}
    </button>;
}
