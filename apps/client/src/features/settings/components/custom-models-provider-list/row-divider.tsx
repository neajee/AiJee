import { View } from "@/components/dom";

import { providerPageStyles } from '../../utils/custom-models-styles';
import type { RowDividerProps } from './component-types';

export function RowDivider({ colors }: RowDividerProps) {
  return <View style={[providerPageStyles.divider, { backgroundColor: colors.separator }]} />;
}
