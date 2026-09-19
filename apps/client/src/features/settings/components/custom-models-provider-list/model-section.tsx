import { toTailwind } from "@/styles/to-tailwind";
import { providerPageStyles } from '../../utils/custom-models-styles';
import type { ModelSectionProps } from './component-types';
export function ModelSection({
  title,
  children,
  colors
}: ModelSectionProps) {
  return <div className={toTailwind(providerPageStyles.section)}>
      <span className={toTailwind([providerPageStyles.sectionTitle, {
      color: colors.textSecondary
    }])}>{title}</span>
      <div className={toTailwind([providerPageStyles.rows, {
      borderColor: colors.separator,
      backgroundColor: colors.cardBg
    }])}>
        {children}
      </div>
    </div>;
}
