import { createFileRoute } from "@tanstack/react-router";
import WorkIndex from "@/screens/work/index";
export const Route = createFileRoute("/_app/work/")({ component: WorkIndex });
