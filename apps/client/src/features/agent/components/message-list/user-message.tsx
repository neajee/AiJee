import { memo, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Pencil, X } from "lucide-react";
import { Colors, Fonts } from "@/constants/theme";
import { HAIRLINE_WIDTH } from "@/constants/layout";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../agent-types";
interface UserMessageProps {
  message: ChatMessage;
  isDark: boolean;
  editing?: boolean;
  editText?: string;
  onEdit?: () => void;
  onChangeEdit?: (text: string) => void;
  onCancelEdit?: () => void;
  onSubmitEdit?: () => void;
}
const COLLAPSE_AFTER_LINES = 12;
const COLLAPSE_AFTER_CHARS = 1600;
function previewText(text: string): {
  preview: string;
  collapsible: boolean;
} {
  const lines = text.split("\n");
  const collapsible = lines.length > COLLAPSE_AFTER_LINES || text.length > COLLAPSE_AFTER_CHARS;
  if (!collapsible) return {
    preview: text,
    collapsible: false
  };
  const preview = lines.slice(0, COLLAPSE_AFTER_LINES).join("\n");
  return {
    preview: `${preview.slice(0, COLLAPSE_AFTER_CHARS)}\n…`,
    collapsible: true
  };
}
export const UserMessage = memo(function UserMessage({
  message,
  isDark,
  editing = false,
  editText = message.text,
  onEdit,
  onChangeEdit,
  onCancelEdit,
  onSubmitEdit
}: UserMessageProps) {
  const colors = useThemeTokens();
  const attachments = message.attachments ?? [];
  const images = attachments.filter(a => a.type === "image" && !!a.data);
  const {
    preview,
    collapsible
  } = useMemo(() => previewText(message.text), [message.text]);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [message.id, message.text]);
  useEffect(() => {
    if (false) return;
    const collapse = () => setExpanded(false);
    window.addEventListener("blur", collapse);
    return () => window.removeEventListener("blur", collapse);
  }, []);
  return <div className="flex flex-col">
      <div className={"  bg-surface-raised"}>
        {images.length > 0 && <div horizontal className="flex flex-col">
            {images.map(img => <img key={img.id} src={`data:${img.mimeType || "image/png"};base64,${img.data}`} className="max-w-full object-cover" />)}
          </div>}
        {editing ? <>
            <input autoFocus multiline value={editText} onChange={event => onChangeEdit(event.target.value)} className={"  text-foreground border-border"} />
            <div className="flex flex-col">
              <button onClick={onCancelEdit} aria-label="Cancel edit" className="inline-flex items-center">
                <X size={14} color={colors.textTertiary} />
              </button>
              <button onClick={onSubmitEdit} disabled={!editText.trim()} aria-label="Send edited message" className={"  bg-accent"}>
                <Check size={14} color={colors.background} />
              </button>
            </div>
          </> : !!message.text && <>
            <span className={"  text-foreground"}>
              {expanded || !collapsible ? message.text : preview}
            </span>
            {collapsible && <div className="flex flex-col">
                <div className={"  bg-muted"} />
                <button onClick={() => setExpanded(value => !value)} role="button" aria-label={expanded ? "收起长消息" : "展开长消息"}>
                  <span className={"  text-text-tertiary"}>{expanded ? "收起" : "展开全文"}</span>
                  <ChevronDown size={12} color={colors.textTertiary} className="flex flex-col" />
                </button>
                <div className={"  bg-muted"} />
              </div>}
          </>}
      </div>
      {!editing && onEdit && <button onClick={onEdit} role="button" aria-label="Edit message" className="inline-flex items-center">
          <Pencil size={13} color={colors.textTertiary} strokeWidth={1.8} />
        </button>}
    </div>;
});
const styles = {
  container: {
    alignItems: "flex-end",
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 4
  },
  bubble: {
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 10,
    paddingBottom: 10,
    maxWidth: "85%"
  },
  images: {
    marginBottom: 6
  },
  imagesContent: {
    gap: 6,
    flexDirection: "row"
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.sans
  },
  disclosureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 10
  },
  disclosureLine: {
    height: HAIRLINE_WIDTH,
    flex: 1
  },
  disclosure: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 24,
    paddingLeft: 2,
    paddingRight: 2
  },
  disclosurePressed: {
    opacity: 0.68
  },
  disclosureText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium
  },
  disclosureIconExpanded: {
    transform: [{
      rotate: "180deg"
    }]
  },
  editor: {
    minWidth: 220,
    minHeight: 64,
    maxHeight: 180,
    borderWidth: HAIRLINE_WIDTH,
    borderRadius: 8,
    paddingLeft: 9,
    paddingRight: 9,
    paddingTop: 7,
    paddingBottom: 7,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.sans
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 6
  },
  editButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center"
  },
  editTrigger: {
    marginTop: 2,
    padding: 5,
    opacity: 0.75
  }
} as const;
