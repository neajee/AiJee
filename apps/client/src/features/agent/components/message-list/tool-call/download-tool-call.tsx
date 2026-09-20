import { memo } from "react";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ToolCallInfo } from "../../../component-types.ts";
import { parseToolArguments } from "../../../utils/message-list";
interface DownloadToolCallProps {
  tc: ToolCallInfo;
  isDark: boolean;
}
export const DownloadToolCall = memo(function DownloadToolCall({
  tc,
  isDark
}: DownloadToolCallProps) {
  const colors = useThemeTokens();
  const parsed = parseToolArguments(tc.arguments);
  const url = parsed.url as string || "";
  return <div>
      <div className="flex flex-col">
        <span className={"  text-text-secondary"}>
          Download
        </span>
        {url ? <span className={"  text-text-tertiary"}>
            {url}
          </span> : null}
      </div>

    </div>;
});
const styles = {
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
    paddingBottom: 4
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: "500"
  },
  url: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    flex: 1
  }
} as const;
