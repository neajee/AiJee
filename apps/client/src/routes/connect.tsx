import { createFileRoute } from "@tanstack/react-router";
import DirectConnectScreen from "@/screens/connect";
export const Route = createFileRoute("/connect")({ component: DirectConnectScreen });
