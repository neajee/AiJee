import { createFileRoute } from "@tanstack/react-router";
import SettingsScreen from "@/screens/settings/index";
export const Route = createFileRoute("/_app/settings/")({ component: SettingsScreen });
