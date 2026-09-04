import { memo } from "react";
import { useMessageListController, type MessageListProps } from "../../hooks/use-message-list-controller";
import { MessageListView } from "./view";

export const MessageList = memo(function MessageList(props: MessageListProps) {
  const controller = useMessageListController(props);
  return <MessageListView controller={controller} />;
});

export type { MessageListProps } from "../../hooks/use-message-list-controller";
