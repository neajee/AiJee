import { providerPageStyles } from '../../utils/custom-models-styles';
import type { ModelSectionProps } from './component-types';
export function ModelSection({
  title,
  children,
  colors
}: ModelSectionProps) {
  return <div className={"block"}>
      <span className={"  text-text-secondary"}>{title}</span>
      <div className={"  border-border bg-card"}>
        {children}
      </div>
    </div>;
}
