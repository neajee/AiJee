import { memo, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Pencil, X } from "lucide-react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../../component-types.ts";
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
  return <div className="flex flex-col items-end px-4 py-1">
      <div className="max-w-[85%] bg-surface-raised px-3.5 py-2.5">
        {images.length > 0 && <div className="mb-1.5 flex gap-1.5 overflow-x-auto">
            {images.map(img => <img key={img.id} src={`data:${img.mimeType || "image/png"};base64,${img.data}`} className="size-[72px] shrink-0 rounded-lg object-cover" />)}
          </div>}
        {editing ? <>
            <textarea autoFocus value={editText} onChange={event => onChangeEdit?.(event.target.value)} className="min-h-16 w-full min-w-[220px] max-h-[180px] resize-none rounded-lg border border-border bg-transparent p-2 text-sm leading-5 text-foreground outline-none" />
            <div className="mt-1.5 flex justify-end gap-1.5">
              <button onClick={onCancelEdit} aria-label="Cancel edit" className="flex size-[26px] items-center justify-center rounded-md hover:bg-hover">
                <X size={14} color={colors.textTertiary} />
              </button>
              <button onClick={onSubmitEdit} disabled={!editText.trim()} aria-label="Send edited message" className="flex size-[26px] items-center justify-center rounded-md bg-primary text-background disabled:opacity-40">
                <Check size={14} />
              </button>
            </div>
          </> : !!message.text && <>
            <span className="block whitespace-pre-wrap break-words text-sm leading-5 text-foreground">
              {expanded || !collapsible ? message.text : preview}
            </span>
            {collapsible && <div className="mt-2.5 flex items-center gap-[9px]">
                <div className="h-px flex-1 bg-border" />
                <button onClick={() => setExpanded(value => !value)} role="button" aria-label={expanded ? "收起长消息" : "展开长消息"} className="flex min-h-6 items-center gap-1 px-0.5 text-xs font-medium text-text-tertiary hover:opacity-70">
                  <span>{expanded ? "收起" : "展开全文"}</span>
                  <ChevronDown size={12} color={colors.textTertiary} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                <div className="h-px flex-1 bg-border" />
              </div>}
          </>}
      </div>
      {!editing && onEdit && <button onClick={onEdit} role="button" aria-label="Edit message" className="mt-0.5 p-1.5 opacity-75 hover:opacity-100">
          <Pencil size={13} color={colors.textTertiary} strokeWidth={1.8} />
        </button>}
    </div>;
});
