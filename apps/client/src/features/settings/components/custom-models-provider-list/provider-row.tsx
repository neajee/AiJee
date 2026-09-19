import { toTailwind } from "@/styles/to-tailwind";
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
      {connected ? <div className={toTailwind([providerPageStyles.statusDot, {
      backgroundColor: colors.successColor
    }])} /> : null}
      <ProviderMark name={name} id={id} colors={colors} />
      <div className={toTailwind(providerPageStyles.rowCopy)}>
        <span className={toTailwind([providerPageStyles.rowName, {
        color: colors.textPrimary
      }])}>{name}</span>
        {meta ? <span className={toTailwind([providerPageStyles.rowMeta, {
        color: colors.textMuted
      }])}>{meta}</span> : null}
      </div>
    </>;
  if (trailing) {
    return <div className={toTailwind([providerPageStyles.row, disabled && {
      opacity: 0.5
    }])}>
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
