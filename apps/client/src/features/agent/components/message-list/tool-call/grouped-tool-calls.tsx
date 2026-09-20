import { memo, useEffect, useRef, useState } from 'react';
import { Animated } from "@/platform/animation";
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { ToolCallInfo } from '../agent-types';
import { isToolActive } from '../../../utils/message-list';
import { ToolBody, ToolHeader } from './tool-disclosure';
import { formatSingleLine } from '../../../utils/tool-call-grouping';
const MAX_VISIBLE = 5;
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
  const colors = useThemeTokens();
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
      <ToolHeader expanded={expanded} expandable onToggle={() => setExpanded(value => !value)} isDark={isDark} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${calls.length} ${toolName} calls`}>
        <div className={""}>
          <span className={"" + " " + ""}>{activeCall ? base.activeBefore ?? base.before : base.before}</span>
          <AnimatedNumber value={calls.length} className={"" + " " + ""} />
          <span className={"" + " " + ""}>{toolName === 'read' ? ' files' : base.after}</span>
        </div>
      </ToolHeader>
      <ToolBody expanded={expanded}>
        <div className={""}>
          {visible.map(call => <div key={call.id} className={""}><span className={"" + " " + ""}>{formatSingleLine(call)}</span></div>)}
          {calls.length > MAX_VISIBLE && !showAll && <button role="button" onClick={() => setShowAll(true)}><span className={"" + " " + ""}>Show {calls.length - MAX_VISIBLE} more…</span></button>}
        </div>
      </ToolBody>
    </div>;
});
function AnimatedNumber({
  value,
  style
}: {
  value: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    if (value === previous.current) return;
    previous.current = value;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 80,
      useNativeDriver: true
    }).start(() => {
      setDisplay(value);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true
      }).start();
    });
  }, [opacity, value]);
  return <span className={"" + " " + "opacity-[null]"}>{display}</span>;
}
