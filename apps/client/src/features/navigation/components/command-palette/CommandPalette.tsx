import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { useCommandPaletteController } from "../../hooks/use-command-palette-controller";
import type { CommandPaletteProps } from "./component-types";

export function CommandPalette({ visible, onClose }: CommandPaletteProps) {
  const {
    search,
    setSearch,
    selectedIndex,
    sessionsLoading,
    sections,
    inputRef,
    scrollRef,
    itemRefs,
    handleClose,
    handleKeyPress
  } = useCommandPaletteController({ visible, onClose });

  if (!visible || typeof document === "undefined") return null;
  let flatIndex = 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/35 px-4 pt-20 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="搜索对话"
        className="flex max-h-[420px] w-full max-w-[560px] flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-border px-4">
          <Search size={14} strokeWidth={2} className="shrink-0 text-text-tertiary" />
          <input
            ref={inputRef}
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="搜索对话…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-body text-foreground outline-none placeholder:text-text-tertiary"
          />
        </div>

        <div ref={scrollRef} role="listbox" className="min-h-0 flex-1 overflow-y-auto py-1">
          {sessionsLoading ? (
            <div className="flex justify-center py-6">
              <span className="size-3.5 animate-spin rounded-full border-2 border-border border-t-text-tertiary" />
            </div>
          ) : sections.length === 0 ? (
            <div className="py-6 text-center text-caption text-text-tertiary">
              {search.trim() ? "没有匹配的对话" : "暂无最近对话"}
            </div>
          ) : null}

          {sections.map(section => (
            <div key={section.title}>
              <div className="px-4 pb-1 pt-3 text-meta font-medium uppercase tracking-wide text-text-tertiary">
                {section.title}
              </div>
              {section.items.map(item => {
                const index = flatIndex++;
                const isSelected = index === selectedIndex;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    ref={node => {
                      itemRefs.current[index] = node;
                    }}
                    onClick={item.onSelect}
                    role="option"
                    aria-selected={isSelected}
                    className={`flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors ${isSelected ? "bg-active" : "hover:bg-hover"}`}
                  >
                    <Icon
                      size={13}
                      strokeWidth={1.8}
                      className={`shrink-0 ${isSelected ? "text-foreground" : "text-text-tertiary"}`}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-caption text-foreground">{item.label}</span>
                      {item.description ? (
                        <span className="truncate text-meta text-text-secondary">{item.description}</span>
                      ) : null}
                    </span>
                    {isSelected ? <span className="shrink-0 font-mono text-caption text-text-tertiary">↵</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>,
    document.body
  );
}
