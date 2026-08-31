import { View } from "react-native";
import { Redirect } from "expo-router";

import { useServersStore } from "@/features/servers/store";
import { useAuthStore } from "@/features/auth/store";
import { useWorkspaceStore } from "@/features/workspace/store";
import MorphLoading from "@/components/ui/morph-loading";
import WorkIndex from "./work";

export default function AppIndex() {
  const serversLoaded = useServersStore((s) => s.loaded);
  const bootstrapReady = useServersStore((s) => s.bootstrapReady);
  const authLoaded = useAuthStore((s) => s.loaded);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const workspaceLoading = useWorkspaceStore((s) => s.loading);

  if (!serversLoaded || !bootstrapReady || !authLoaded || workspaceLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <MorphLoading size="lg" />
      </View>
    );
  }

  const workspaceId = selectedWorkspaceId ?? workspaces[0]?.id;
  if (workspaceId) return <Redirect href={`/workspace/${workspaceId}`} />;

  // Work is the no-project home state, not a route the user needs to see.
  return <WorkIndex />;
}
