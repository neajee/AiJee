import { providerPageStyles } from '../../utils/custom-models-styles';
import type { ModelSectionProps } from './component-types';
export function ModelSection({
  title,
  children,
  colors
}: ModelSectionProps) {
  return <div className={""}>
      <span className={"" + " " + ""}>{title}</span>
      <div className={"" + " " + ""}>
        {children}
      </div>
    </div>;
}
