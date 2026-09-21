import { LoaderCircle, Minus } from "lucide-react";
import { useIsSessionStreaming } from "@aijee/client-sdk";
interface SessionActivityIndicatorProps {
  sessionId: string;
  color: string;
  /**
   * Draws a dash while the session is idle so lists stay aligned. Off for
   * layouts where the indicator trails the title and absence reads as "idle".
   */
  idlePlaceholder?: boolean;
}
export function SessionActivityIndicator({
  sessionId,
  color,
  idlePlaceholder = true
}: SessionActivityIndicatorProps) {
  const isWorking = useIsSessionStreaming(sessionId);
  if (!isWorking) {
    return idlePlaceholder ? <Minus size={14} color={color} strokeWidth={2} /> : null;
  }
  return <LoaderCircle size={13} color={color} strokeWidth={2} className="animate-spin" aria-label="生成中" />;
}
