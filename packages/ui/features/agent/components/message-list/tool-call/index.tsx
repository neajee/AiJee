import { memo, useMemo } from 'react';
import { View } from 'tamagui';
import type { ToolCallInfo } from '../../../types';
import { BashToolCall } from './bash-tool-call';
import { ReadToolCall } from './read-tool-call';
import { WriteToolCall } from './write-tool-call';
import { EditToolCall } from './edit-tool-call';
import { DownloadToolCall } from './download-tool-call';
import { SubagentToolCall } from './subagent-tool-call';
import { GenericToolCall } from './generic-tool-call';
import { GroupedToolCalls } from './grouped-tool-calls';
import { groupToolCalls } from '../../../utils/tool-call-grouping';
import { styles } from './styles';

export const ToolCallGroup = memo(function ToolCallGroup({ toolCalls, isDark }: { toolCalls: ToolCallInfo[]; isDark: boolean }) {
  const groups = useMemo(() => groupToolCalls(toolCalls), [toolCalls]);
  if (!groups.length) return null;
  return <View style={styles.container}>{groups.map((group) => group.calls.length === 1 ? <SingleToolCall key={group.key} tc={group.calls[0]} isDark={isDark} /> : <GroupedToolCalls key={group.key} toolName={group.toolName} calls={group.calls} isDark={isDark} />)}</View>;
});

function SingleToolCall({ tc, isDark }: { tc: ToolCallInfo; isDark: boolean }) {
  switch (tc.name) {
    case 'bash': return <BashToolCall tc={tc} isDark={isDark} />;
    case 'read': return <ReadToolCall tc={tc} isDark={isDark} />;
    case 'write': return <WriteToolCall tc={tc} isDark={isDark} />;
    case 'edit': return <EditToolCall tc={tc} isDark={isDark} />;
    case 'download': return <DownloadToolCall tc={tc} isDark={isDark} />;
    case 'subagent': return <SubagentToolCall tc={tc} isDark={isDark} />;
    default: return <GenericToolCall tc={tc} isDark={isDark} />;
  }
}
