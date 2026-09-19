import { createFileRoute } from "@tanstack/react-router";
import PackagesScreen from "@/screens/packages";
export const Route = createFileRoute("/_app/packages")({ component: PackagesScreen });
