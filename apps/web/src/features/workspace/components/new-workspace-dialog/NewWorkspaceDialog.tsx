import { VirtualList } from "@/components/ui/virtual-list";
import { ChevronDown, File, Folder, Globe } from "lucide-react";
import type { PathCompletion } from "@aijee/client-sdk";
import type { NewWorkspaceController } from "../../hooks/use-new-workspace-controller";
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { AppModal } from '@/components/ui/app-modal';
export function NewWorkspaceDialogView({
  controller
}: {
  controller: NewWorkspaceController;
}) {
  const {
    visible,
    onClose,
    isDark,
    colors,
    isWideScreen,
    insets,
    useInlineSuggestions,
    path,
    name,
    nameEdited,
    showSuggestions,
    suggestionIndex,
    suggestions,
    loadingSuggestions,
    pathRef,
    nameRef,
    suggestionsRef,
    fetchCompletions,
    setShowSuggestions,
    handleSuggestionScrollFailure,
    handlePathChange,
    handleSelectSuggestion,
    handleNameChange,
    dismissSuggestions,
    handleCreate,
    handlePathKeyPress,
    handleNameKeyPress,
    canCreate,
    activeServerId,
    servers,
    switchingServer,
    handleSelectServer,
    pathPreview,
    textPrimary,
    textMuted,
    inputBg,
    inputBorder,
    suggestionHover,
    selectedBg,
    popoverBg
  } = controller;
  const displayEntryName = (entryPath: string) => entryPath.replace(/\/+$/, '').split('/').pop() || entryPath;
  const formContent = <>
      <div className="flex flex-col gap-1.5">
        <label className="text-meta font-medium text-text-secondary" htmlFor="workspace-name">项目名称</label>
        <div className="flex h-9 items-center gap-2.5 rounded-lg border border-border bg-surface-raised px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Folder size={16} className="shrink-0 text-text-tertiary" strokeWidth={1.8} />
          <input id="workspace-name" ref={nameRef} className="w-full bg-transparent text-caption text-foreground outline-none placeholder:text-text-tertiary" value={name} onChange={event => handleNameChange(event.target.value)} onKeyDown={handleNameKeyPress as any} placeholder="项目名称" />
        </div>
        {!nameEdited && name.length > 0 && <span className="text-meta text-text-tertiary">已根据路径自动生成</span>}
      </div>
      <div className="relative flex flex-col gap-1.5">
        <span className="text-body font-semibold text-foreground">运行服务器</span>
        <details className="group">
          <summary className="flex h-9 cursor-pointer list-none items-center gap-2.5 rounded-lg border border-border bg-surface-raised px-3 text-caption text-foreground outline-none marker:hidden group-open:border-primary">
            <Globe size={16} className="shrink-0 text-primary" strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate">{servers.find(server => server.id === activeServerId)?.name ?? '当前服务器'}</span>
            {switchingServer ? <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" /> : <ChevronDown size={16} className="text-text-tertiary transition-transform group-open:rotate-180" />}
          </summary>
          {servers.length > 0 && <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-xl">
            {servers.map(server => <button type="button" key={server.id} disabled={switchingServer} onClick={() => void handleSelectServer(server)} className={`flex min-h-7 w-full items-center gap-2 rounded-md px-2 text-left text-meta hover:bg-hover disabled:opacity-50 ${server.id === activeServerId ? 'bg-hover' : ''}`}>
              <Globe size={13} className="shrink-0 text-text-tertiary" />
              <span className="min-w-0 flex-1 truncate">{server.name}</span>
              <span className="max-w-36 truncate text-meta text-text-tertiary">{server.address}</span>
            </button>)}
          </div>}
        </details>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-body font-semibold text-foreground" htmlFor="workspace-path">源文件夹</label>
        {pathPreview && !showSuggestions ? <div className="flex flex-col">
            <span className="text-[10px] text-text-tertiary">位置</span>
            <span className="truncate text-[11px] text-text-secondary" title={pathPreview}>{pathPreview}</span>
          </div> : null}
        <div className="mt-1 max-h-64 overflow-hidden rounded-xl border border-border bg-card p-1">
            <div className="flex h-8 items-center gap-2 border-b border-border/60 px-2 focus-within:border-primary">
              <span className="flex size-4 shrink-0 items-center justify-center text-text-tertiary">↑</span>
              <input id="workspace-path" ref={pathRef} className="min-w-0 flex-1 bg-transparent text-meta text-foreground outline-none placeholder:text-text-tertiary" value={path} onChange={event => handlePathChange(event.target.value)} onKeyDown={handlePathKeyPress as any} placeholder="~/" onFocus={() => {
                setShowSuggestions(true);
                fetchCompletions(path || "~/");
              }} onBlur={useInlineSuggestions ? () => {
                setTimeout(dismissSuggestions, 200);
              } : undefined} />
              {loadingSuggestions && <span className="size-3 shrink-0 animate-spin rounded-full border-2 border-border border-t-primary" />}
            </div>
            {suggestions.length === 0 ? <div className="flex h-24 items-center justify-center text-meta text-text-tertiary">输入路径或选择目录</div> : useInlineSuggestions ? <div className="flex max-h-56 flex-col overflow-y-auto">
                {suggestions.map(item => <button className="flex min-h-7 items-center gap-2 rounded px-2 text-left text-meta text-foreground hover:bg-hover" key={item.path} title={item.path} onClick={() => handleSelectSuggestion(item)}>
                    {item.is_dir ? <Folder size={13} color={textMuted} strokeWidth={1.8} /> : <File size={13} color={textMuted} strokeWidth={1.8} />}
                    <span className="min-w-0 flex-1 truncate">{displayEntryName(item.path)}</span>
                  </button>)}
              </div> : <VirtualList<PathCompletion> ref={suggestionsRef} data={suggestions} keyExtractor={item => item.path} className="flex max-h-56 flex-col overflow-y-auto" nestedScrollEnabled getItemLayout={(_data, index) => ({
          length: 28,
          offset: 28 * index,
          index
        })} onScrollToIndexFailed={handleSuggestionScrollFailure} renderItem={({ item }) => <button className="flex min-h-7 items-center gap-2 rounded px-2 text-left text-meta text-foreground hover:bg-hover" title={item.path} onClick={() => handleSelectSuggestion(item)}>
                    {item.is_dir ? <Folder size={13} color={textMuted} strokeWidth={1.8} /> : <File size={13} color={textMuted} strokeWidth={1.8} />}
                    <span className="min-w-0 flex-1 truncate">{displayEntryName(item.path)}</span>
                  </button>} />}
          </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-3">
        <button className="rounded-md px-3 py-1.5 text-meta text-text-secondary hover:bg-hover" onClick={onClose}>取消</button>
        <button className="rounded-md bg-primary px-3 py-1.5 text-meta font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" onClick={handleCreate} disabled={!canCreate}>添加项目</button>
      </div>
    </>;

  return <AppModal visible={visible} onClose={onClose} contentStyle={isWideScreen ? { maxWidth: 'min(672px, calc(100vw - 2rem))' } : { alignSelf: 'end', marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxWidth: '100%' }}>
      <div className="flex flex-col gap-4">
        <header><h2 className="text-body font-semibold text-foreground">新建项目</h2></header>
        <div className="flex flex-col gap-3">{formContent}</div>
      </div>
    </AppModal>;
}
