export interface WorkspaceSheetProps {
  visible: boolean;
  onClose: () => void;
}

export interface SessionPageProps {
  workspaceId: string;
  onSessionPress: (sessionId: string) => void;
  onDismiss: () => void;
}
