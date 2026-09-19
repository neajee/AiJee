import { useExtensionUiController } from "../../hooks/use-extension-ui-controller";
import { ExtensionUiView } from "./view";

export function ExtensionUiDialog({ sessionId, request }: { sessionId?: string | null; request?: import("../../extension-ui").PendingExtensionUiRequest | null }) {
  const controller = useExtensionUiController({ sessionId, request });
  if (!request || !sessionId) return null;
  return <ExtensionUiView controller={controller} />;
}
