import { createFileRoute } from "@tanstack/react-router";
import WorkspaceScreen from "@/screens/workspace/[workspaceId]/index";
export const Route = createFileRoute("/_app/workspace/$workspaceId/")({ component: WorkspaceScreen });
