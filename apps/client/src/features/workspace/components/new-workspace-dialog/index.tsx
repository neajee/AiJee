import { useNewWorkspaceController } from "../../hooks/use-new-workspace-controller";
import { NewWorkspaceDialogView } from "./view";

export function NewWorkspaceDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const controller = useNewWorkspaceController({ visible, onClose });
  return <NewWorkspaceDialogView controller={controller} />;
}
