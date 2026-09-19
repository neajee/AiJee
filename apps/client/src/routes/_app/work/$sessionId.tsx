import { createFileRoute } from "@tanstack/react-router";
import WorkSession from "@/screens/work/[sessionId]";
export const Route = createFileRoute("/_app/work/$sessionId")({ component: WorkSession });
