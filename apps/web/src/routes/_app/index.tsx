import { createFileRoute } from "@tanstack/react-router";
import { Redirect } from "@/hooks/router";
import { useServersStore } from "@/features/servers/store";
import { useAuthStore } from "@/features/auth/store";
import { useWorkspaceStore } from "@/features/workspace/store";
import MorphLoading from "@/components/ui/morph-loading";
export default function AppIndex() {
  const serversLoaded = useServersStore(s => s.loaded);
  const bootstrapReady = useServersStore(s => s.bootstrapReady);
  const authLoaded = useAuthStore(s => s.loaded);
  const workspaceLoading = useWorkspaceStore(s => s.loading);
  if (!serversLoaded || !bootstrapReady || !authLoaded || workspaceLoading) {
    return <div className={"flex flex-1 flex-col justify-center items-center"}>
        <MorphLoading size="lg" />
      </div>;
  }
  // Keep the new-chat page addressable and make the root URL deterministic.
  return <Redirect href="/work" />;
}
export const Route = createFileRoute("/_app/")({
  component: AppIndex
});
