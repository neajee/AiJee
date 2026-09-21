import { memo, useState } from "react";
import type { ChatMessage } from "../../component-types.ts";
import { AssistantMarkdown } from "./assistant-markdown";
interface SystemMessageProps {
  message: ChatMessage;
  isDark: boolean;
}
export const SystemMessage = memo(function SystemMessage({
  message
}: SystemMessageProps) {
  const [expanded, setExpanded] = useState(false);
  if (message.systemKind === "compaction") {
    return <div className="flex flex-col">
        <div className={"  bg-muted"} />
        <button role="button" aria-label="Toggle compaction summary" onClick={() => setExpanded(value => !value)} className="inline-flex items-center">
          <span className={"  text-text-tertiary"}>
            上下文已压缩{message.compactionTokensBefore !== undefined ? ` · ${message.compactionTokensBefore.toLocaleString()} tokens` : ""}
          </span>
        </button>
        <div className={"  bg-muted"} />
        {expanded && message.text ? <div className="flex flex-col">
            <AssistantMarkdown text={message.text} />
          </div> : null}
      </div>;
  }
  const label = message.systemKind === "bashExecution" ? `$ ${message.command || "command"}` : message.text || "System event";
  return <div className="flex flex-col">
      <div className={"  bg-surface-raised"}>
        <span className={"  text-text-tertiary"}>
          {label}
        </span>
      </div>
    </div>;
});