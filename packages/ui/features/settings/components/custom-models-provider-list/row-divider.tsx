import { View } from 'react-native';
import { providerPageStyles } from '../../utils/custom-models-styles';
import type { RowDividerProps } from './types';

export function RowDivider({ colors }: RowDividerProps) {
  return <View style={[providerPageStyles.divider, { backgroundColor: colors.separator }]} />;
}
