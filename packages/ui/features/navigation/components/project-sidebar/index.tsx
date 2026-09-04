import { memo } from "react";
import { useProjectSidebarController } from "../../hooks/use-project-sidebar-controller";
import { ProjectSidebarView } from "./project-view";
export { SettingsSidebar } from "./settings-view";

export const ProjectSidebar = memo(function ProjectSidebar() {
  const controller = useProjectSidebarController();
  return <ProjectSidebarView controller={controller} />;
});
