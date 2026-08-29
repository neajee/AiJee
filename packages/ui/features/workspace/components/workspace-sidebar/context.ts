import { createContext, useContext } from "react";

export type WorkspacePaneTab = "git" | "files" | "preview";

export interface WorkspacePaneRequest {
  tab: WorkspacePaneTab;
  revision: number;
}

export interface WorkspacePaneContextValue {
  request: WorkspacePaneRequest | null;
  activeTab: WorkspacePaneTab;
  setActiveTab: (tab: WorkspacePaneTab) => void;
}

export const WorkspacePaneContext = createContext<WorkspacePaneContextValue | null>(null);

export function useWorkspacePaneRequest() {
  return useContext(WorkspacePaneContext);
}
