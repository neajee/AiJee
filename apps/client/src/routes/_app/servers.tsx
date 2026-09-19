import { createFileRoute } from "@tanstack/react-router";
import ServersScreen from "@/screens/servers";
export const Route = createFileRoute("/_app/servers")({ component: ServersScreen });
