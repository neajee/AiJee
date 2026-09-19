import { toTailwind } from "@/styles/to-tailwind";
import { providerPageStyles } from '../../utils/custom-models-styles';
import type { RowDividerProps } from './component-types';
export function RowDivider({
  colors
}: RowDividerProps) {
  return <div className={toTailwind([providerPageStyles.divider, {
    backgroundColor: colors.separator
  }])} />;
}
