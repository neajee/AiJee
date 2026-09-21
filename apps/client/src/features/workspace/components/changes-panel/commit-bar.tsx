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
  const commitInputRef = useRef<HTMLTextAreaElement>(null);
  return <div className="border-t border-border p-2">
      <div className="rounded-md border border-border bg-card">
        <textarea ref={commitInputRef} value={commitMsg} onChange={event => onChangeCommitMsg(event.target.value)} placeholder={`Commit message for ${stagedCount} staged file${stagedCount !== 1 ? "s" : ""}...`} disabled={isCommitting} className="min-h-16 w-full resize-y bg-transparent p-2 text-body outline-none" />
        <div className="flex justify-end p-2">
          {isCommitting ? <span className="size-3 animate-spin" /> : <button onClick={onCommit} disabled={!commitMsg.trim()} aria-label="Commit" {...{
          title: "Commit"
        }}>
              <Send size={13} color={commitMsg.trim() ? isDark ? "#121212" : "#FFFFFF" : textMuted} strokeWidth={2} />
            </button>}
        </div>
      </div>
    </div>;
}