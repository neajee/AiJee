import { useRef } from "react";
import { Send } from "lucide-react";
import { Fonts } from "@/constants/theme";
import { useChangesTheme } from "../../hooks/use-changes-theme";
export function CommitBar({
  stagedCount,
  commitMsg,
  onChangeCommitMsg,
  onCommit,
  isCommitting
}: {
  stagedCount: number;
  commitMsg: string;
  onChangeCommitMsg: (msg: string) => void;
  onCommit: () => void;
  isCommitting: boolean;
}) {
  const {
    isDark,
    textPrimary,
    textMuted,
    dividerColor,
    inputBg,
    inputBorder,
    sendColor
  } = useChangesTheme();
  const commitInputRef = useRef<RNTextInput>(null);
  return <div>
      <div>
        <input ref={commitInputRef} value={commitMsg} onChange={event => onChangeCommitMsg(event.target.value)} placeholder={`Commit message for ${stagedCount} staged file${stagedCount !== 1 ? "s" : ""}...`} multiline editable={!isCommitting} />
        <div className={"block"}>
          {isCommitting ? <span className="size-3 animate-spin" /> : <button onClick={onCommit} disabled={!commitMsg.trim()} aria-label="Commit" {...{
          title: "Commit"
        }}>
              <Send size={13} color={commitMsg.trim() ? isDark ? "#121212" : "#FFFFFF" : textMuted} strokeWidth={2} />
            </button>}
        </div>
      </div>
    </div>;
}
const styles = {
  commitBar: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 0.633
  },
  commitInputBox: {
    borderWidth: 0.633,
    borderRadius: 8,
    overflow: "hidden"
  },
  commitTextarea: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 64,
    maxHeight: 100,
    outlineStyle: "none"
  } as any,
  commitActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 6
  },
  commitSendButton: {
    width: 30,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center"
  }
} as const;
