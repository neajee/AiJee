import { useRef, useEffect } from 'react';
import { SlashCommand } from '../../utils/prompt-input';
interface SlashCommandDropdownProps {
  commands: SlashCommand[];
  selectedIndex: number;
  dropdownAnim: unknown;
  overlay?: boolean;
  onSelect: (command: SlashCommand) => void;
}
export function SlashCommandDropdown({
  commands,
  selectedIndex,
  dropdownAnim: _dropdownAnim,
  overlay: _overlay = false,
  onSelect
}: SlashCommandDropdownProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.querySelector<HTMLElement>(`[data-command-index="${selectedIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);
  return <div className="max-h-64 overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-xl" role="menu" aria-label="Slash commands">
      <div ref={scrollRef} className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
        {commands.map((cmd, index) => <button key={cmd.name} data-command-index={index} onClick={() => onSelect(cmd)} role="menuitem" aria-label={`/${cmd.name} — ${cmd.description}`} className={`flex min-h-9 w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left transition-colors ${index === selectedIndex ? 'bg-hover' : 'hover:bg-hover'}`}>
            <span className="w-28 shrink-0 truncate font-mono text-caption font-medium text-foreground">/{cmd.name}</span>
            <span className="min-w-0 flex-1 truncate text-caption text-text-secondary">{cmd.description || 'Command'}</span>
          </button>)}
      </div>
    </div>;
}
