import { providerPageStyles } from '../../utils/custom-models-styles';
import { ProviderMark } from './provider-mark';
import type { ProviderRowProps } from './component-types';
export function ProviderRow({
  name,
  id,
  meta,
  connected,
  colors,
  onPress,
  trailing,
  disabled
}: ProviderRowProps) {
  const content = <>
      {connected ? <div className={"" + " " + ""} /> : null}
      <ProviderMark name={name} id={id} colors={colors} />
      <div className={""}>
        <span className={"" + " " + ""}>{name}</span>
        {meta ? <span className={"" + " " + ""}>{meta}</span> : null}
      </div>
    </>;
  if (trailing) {
    return <div className={"" + " " + (disabled ? "opacity-[0.5]" : "")}>
        <button onClick={onPress} disabled={disabled} role="button" aria-label={name} accessibilityState={{
        disabled
      }}>
          {content}
        </button>
        {trailing}
      </div>;
  }
  return <button onClick={onPress} disabled={disabled} role="button" aria-label={name} accessibilityState={{
    disabled
  }}>
      {content}
    </button>;
}
