import { createFileRoute } from "@tanstack/react-router";
import SettingsSectionScreen from "@/screens/settings/[section]";
export const Route = createFileRoute("/_app/settings/$section")({ component: SettingsSectionScreen });
