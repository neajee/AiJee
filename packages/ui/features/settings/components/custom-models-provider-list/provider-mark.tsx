import { Text, View } from 'tamagui';

import { ProviderIcon as LobeProviderIcon } from '@lobehub/icons-rn';
import { ProviderIcon } from '@/components/provider-icons';
import { providerPageStyles } from '../../utils/custom-models-styles';
import { legacyBrand, lobeProviderKey } from '../../utils/custom-models-provider';
import type { ProviderMarkProps } from './types';

export function ProviderMark({ name, id, colors }: ProviderMarkProps) {
  const initial = name.trim().match(/[A-Za-z\u4e00-\u9fff]/)?.[0]?.toUpperCase() ?? '?';
  const provider = lobeProviderKey(name, id);
  const brand = legacyBrand(name, id);

  return (
    <View style={[providerPageStyles.mark, { backgroundColor: colors.accentBg }]}>
      {provider ? (
        <LobeProviderIcon provider={provider} size={18} type="mono" color="#000000" />
      ) : brand ? (
        <ProviderIcon provider={brand} size={17} color="#000000" />
      ) : (
        <Text style={[providerPageStyles.markText, { color: colors.textSecondary }]}>{initial}</Text>
      )}
    </View>
  );
}
