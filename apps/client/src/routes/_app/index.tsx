import { createFileRoute } from "@tanstack/react-router";
import AppIndex from "@/screens/index";
export const Route = createFileRoute("/_app/")({ component: AppIndex });
