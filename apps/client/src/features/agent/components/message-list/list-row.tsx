import { memo } from "react";
import Animated, { FadeIn, FadeOut } from "@/platform/animation";
import type { ChatMessage } from "../agent-types";
import { SystemMessage } from "./system-message";
import { UserMessage } from "./user-message";
import { TurnBlock } from "./turn-block";
import type { ListItem } from "../../utils/turns";
export const ListRow = memo(function ListRow({
  item,
  isDark,
  active,
  editing,
  onEdit,
  onChangeEdit,
  onCancelEdit,
  onSubmitEdit,
  onFork,
  forkingEntryId
}: {
  item: ListItem;
  isDark: boolean;
  active: boolean;
  editing: {
    entryId: string;
    text: string;
  } | null;
  onEdit: (message: ChatMessage) => void;
  onChangeEdit: (text: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: () => void;
  onFork: (entryId: string) => void;
  forkingEntryId: string | null;
}) {
  return <div entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} className={""}>
      {item.kind === "turn" ? <TurnBlock turn={item} isDark={isDark} active={active} onFork={onFork} forkingEntryId={forkingEntryId} /> : item.message.role === "user" ? <UserMessage message={item.message} isDark={isDark} editing={editing?.entryId === (item.message.entryId ?? item.message.id)} editText={editing?.entryId === (item.message.entryId ?? item.message.id) ? editing?.text ?? "" : item.message.text} onEdit={item.message.entryId ? () => onEdit(item.message) : undefined} onChangeEdit={onChangeEdit} onCancelEdit={onCancelEdit} onSubmitEdit={onSubmitEdit} /> : <SystemMessage message={item.message} isDark={isDark} />}
    </div>;
});
