import { Text, View } from 'tamagui';

import { providerPageStyles } from '../../utils/custom-models-styles';
import type { ModelSectionProps } from './types';

export function ModelSection({ title, children, colors }: ModelSectionProps) {
  return (
    <View style={providerPageStyles.section}>
      <Text style={[providerPageStyles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[providerPageStyles.rows, { borderColor: colors.separator, backgroundColor: colors.cardBg }]}>
        {children}
      </View>
    </View>
  );
}
