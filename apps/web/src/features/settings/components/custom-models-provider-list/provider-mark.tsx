import { ProviderIcon } from '@/components/provider-icons';
import { legacyBrand, lobeProviderKey } from '../../utils/custom-models-provider';
import type { ProviderMarkProps } from './component-types';
export function ProviderMark({
  name,
  id,
  colors
}: ProviderMarkProps) {
  const initial = name.trim().match(/[A-Za-z\u4e00-\u9fff]/)?.[0]?.toUpperCase() ?? '?';
  const provider = lobeProviderKey(name, id);
  const brand = legacyBrand(name, id);
  const mappedBrand = brand ?? (provider === 'openai' || provider === 'codex' ? 'OpenAI' : provider === 'anthropic' || provider === 'claude' ? 'Anthropic' : provider === 'google' || provider === 'gemini' || provider === 'vertex-ai' ? 'Google' : provider === 'meta' ? 'Meta' : null);
  return <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
      {mappedBrand ? <ProviderIcon provider={mappedBrand} size={17} color={colors.textSecondary} /> : <span className="text-[var(--desc-size)] font-semibold text-text-secondary">{initial}</span>}
    </div>;
}
