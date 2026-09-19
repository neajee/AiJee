import { toTailwind } from "@/styles/to-tailwind";
import { memo, useState } from "react";
import { Colors, Fonts } from "@/constants/theme";
import { HAIRLINE_WIDTH } from "@/constants/layout";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../agent-types";
import { AssistantMarkdown } from "./assistant-markdown";
interface SystemMessageProps {
  message: ChatMessage;
  isDark: boolean;
}
export const SystemMessage = memo(function SystemMessage({
  message,
  isDark
}: SystemMessageProps) {
  const colors = useThemeTokens();
  const [expanded, setExpanded] = useState(false);
  if (message.systemKind === "compaction") {
    return <div className={toTailwind(styles.compactionWrap)}>
        <div className={toTailwind([styles.divider, {
        backgroundColor: colors.border
      }])} />
        <button role="button" aria-label="Toggle compaction summary" onClick={() => setExpanded(value => !value)} className={toTailwind(styles.compactionTrigger)}>
          <span className={toTailwind([styles.compactionLabel, {
          color: colors.textTertiary
        }])}>
            上下文已压缩{message.compactionTokensBefore !== undefined ? ` · ${message.compactionTokensBefore.toLocaleString()} tokens` : ""}
          </span>
        </button>
        <div className={toTailwind([styles.divider, {
        backgroundColor: colors.border
      }])} />
        {expanded && message.text ? <div className={toTailwind(styles.summary)}>
            <AssistantMarkdown text={message.text} />
          </div> : null}
      </div>;
  }
  const label = message.systemKind === "bashExecution" ? `$ ${message.command || "command"}` : message.text || "System event";
  return <div className={toTailwind(styles.container)}>
      <div className={toTailwind([styles.pill, {
      backgroundColor: colors.surfaceRaised
    }])}>
        <span className={toTailwind([styles.text, {
        color: colors.textTertiary
      }])}>
          {label}
        </span>
      </div>
    </div>;
});
const styles = {
  container: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 16,
    paddingRight: 16
  },
  pill: {
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 4,
    paddingBottom: 4,
    maxWidth: "80%"
  },
  text: {
    fontSize: 11,
    fontFamily: Fonts.mono
  },
  compactionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12
  },
  divider: {
    flex: 1,
    height: HAIRLINE_WIDTH
  },
  compactionTrigger: {
    paddingTop: 2,
    paddingBottom: 2
  },
  compactionLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium
  },
  summary: {
    width: "100%",
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 6
  }
} as const;
