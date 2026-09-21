import { useEffect, useRef } from 'react';
import { File, Folder } from 'lucide-react';

export interface FileCompletionItem {
  path: string;
  is_dir: boolean;
  display: string;
}

export function FileCompletionDropdown({
  completions,
  selectedIndex,
  onSelect,
}: {
  completions: FileCompletionItem[];
  selectedIndex: number;
  onSelect: (item: FileCompletionItem) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-file-index="${selectedIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);
  return <div className="max-h-56 overflow-hidden rounded-md border border-border bg-card p-1 shadow-xl" role="menu" aria-label="File mentions">
    <div ref={listRef} className="flex max-h-52 flex-col overflow-y-auto">
      {completions.map((item, index) => <button key={item.path} data-file-index={index} className={`flex min-h-7 w-full items-center gap-1.5 rounded px-2 py-1 text-left transition-colors ${index === selectedIndex ? 'bg-hover' : 'hover:bg-hover'}`} onClick={() => onSelect(item)} role="menuitem" aria-label={`@${item.path}`}>
        {item.is_dir ? <Folder size={12} className="shrink-0 text-text-tertiary" /> : <File size={12} className="shrink-0 text-text-tertiary" />}
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] leading-4 text-foreground">{item.path}</span>
      </button>)}
    </div>
  </div>;
}
