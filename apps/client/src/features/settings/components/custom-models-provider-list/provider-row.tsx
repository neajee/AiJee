import { providerPageStyles } from '../../utils/custom-models-styles';
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
      {connected ? <div className={"  bg-success"} /> : null}
      <ProviderMark name={name} id={id} colors={colors} />
      <div className="flex flex-col">
        <span className={"  text-foreground"}>{name}</span>
        {meta ? <span className={"  text-text-secondary"}>{meta}</span> : null}
      </div>
    </>;
  if (trailing) {
    return <div className={"  opacity-[0.5]"}>
        <button onClick={onClick} disabled={disabled} role="button" aria-label={name}>
          {content}
        </button>
        {trailing}
      </div>;
  }
  return <button onClick={onClick} disabled={disabled} role="button" aria-label={name}>
      {content}
    </button>;
}
