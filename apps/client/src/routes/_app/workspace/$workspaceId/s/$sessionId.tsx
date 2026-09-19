import { createFileRoute } from "@tanstack/react-router";
import WorkspaceSessionScreen from "@/screens/workspace/[workspaceId]/s/[sessionId]";
export const Route = createFileRoute("/_app/workspace/$workspaceId/s/$sessionId")({ component: WorkspaceSessionScreen });
