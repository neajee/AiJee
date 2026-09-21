import { useCustomModelsController } from "../../hooks/use-custom-models-controller";
import { CustomModelsView } from "./CustomModelsSection";
export function CustomModelsSection({
  isDark,
  isNative
}: {
  isDark: boolean;
  isNative?: boolean;
}) {
  const controller = useCustomModelsController();
  return <CustomModelsView controller={controller} isDark={isDark} isNative={isNative} />;
}
