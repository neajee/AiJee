import { memo, useEffect, useRef, useState } from 'react';
import { Bot, Download, Files, Search, Wrench, type LucideIcon } from 'lucide-react';
import type { ToolCallInfo } from '../../../component-types.ts';
import { isToolActive } from '../../../utils/message-list';
import { ToolBody, ToolHeader } from './tool-disclosure';
import { formatSingleLine } from '../../../utils/tool-call-grouping';
const MAX_VISIBLE = 5;
const GROUP_ICONS: Record<string, LucideIcon> = {
  read: Files,
  search: Search,
  scrape: Search,
  crawl: Search,
  download: Download,
  subagent: Bot
};
const GROUP_LABELS: Record<string, {
  before: string;
  after: string;
  activeBefore?: string;
}> = {
  read: {
    before: 'Explored ',
    activeBefore: 'Exploring ',
    after: ' files'
  },
  search: {
    before: '',
    after: ' web searches'
  },
  scrape: {
    before: 'Scraped ',
    after: ' pages'
  },
  crawl: {
    before: 'Crawled ',
    after: ' sites'
  },
  download: {
    before: '',
    after: ' downloads'
  },
  subagent: {
    before: 'Ran ',
    after: ' agents'
  }
};
export const GroupedToolCalls = memo(function GroupedToolCalls({
  toolName,
  calls,
  isDark
}: {
  toolName: string;
  calls: ToolCallInfo[];
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const activeCall = calls.find(isToolActive);
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (activeCall && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setExpanded(true);
    }
  }, [activeCall]);
  const base = GROUP_LABELS[toolName] ?? {
    before: '',
    after: ` ${toolName} calls`
  };
  const visible = expanded ? showAll ? calls : calls.slice(0, MAX_VISIBLE) : [];
  return <div>
      <ToolHeader expanded={expanded} expandable onToggle={() => setExpanded(value => !value)} isDark={isDark} icon={GROUP_ICONS[toolName] ?? Wrench} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${calls.length} ${toolName} calls`}>
        <span className="block truncate text-xs font-semibold text-foreground">
          {activeCall ? base.activeBefore ?? base.before : base.before}{calls.length}{base.after}
        </span>
      </ToolHeader>
      <ToolBody expanded={expanded}>
        <div className="flex flex-col gap-1 pl-0.5">
          {visible.map(call => <div key={call.id} className="flex items-center gap-1.5 py-0.5"><span className="min-w-0 flex-1 truncate text-xs text-text-secondary">{formatSingleLine(call)}</span></div>)}
          {calls.length > MAX_VISIBLE && !showAll && <button role="button" onClick={() => setShowAll(true)} className="self-start px-1 py-1 text-xs text-text-tertiary hover:opacity-70"><span>Show {calls.length - MAX_VISIBLE} more…</span></button>}
        </div>
      </ToolBody>
    </div>;
});
