import { VirtualList } from "@/components/ui/virtual-list";
import { File, Folder } from "lucide-react";
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
    pathPreview,
    textPrimary,
    textMuted,
    inputBg,
    inputBorder,
    suggestionHover,
    selectedBg,
    popoverBg
  } = controller;
  const formContent = <>
      <div className="relative z-10 flex flex-col gap-1.5">
        <label className="text-caption font-medium text-text-secondary" htmlFor="workspace-path">项目路径</label>
        <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
          <Folder size={16} color={textMuted} strokeWidth={1.8} />
          <input id="workspace-path" ref={pathRef} className="min-w-0 flex-1 bg-transparent text-caption text-foreground outline-none placeholder:text-text-tertiary" value={path} onChange={event => handlePathChange(event.target.value)} onKeyDown={handlePathKeyPress as any} placeholder="例如：~/work/my-project" onFocus={() => {
          if (path.length > 0) {
            setShowSuggestions(true);
            fetchCompletions(path);
          }
        }} onBlur={useInlineSuggestions ? () => {
          setTimeout(dismissSuggestions, 200);
        } : undefined} />
          {loadingSuggestions && <span className="size-3 animate-spin rounded-full border-2 border-border border-t-primary" />}
        </div>
        {pathPreview && !showSuggestions ? <div className="flex flex-col">
            <span className="text-meta text-text-tertiary">位置</span>
            <span className="truncate text-meta text-text-secondary" title={pathPreview}>{pathPreview}</span>
          </div> : null}
        {showSuggestions && suggestions.length > 0 && <div className="absolute inset-x-0 top-[4.75rem] z-20 max-h-48 overflow-y-auto rounded-md border border-border bg-card p-1 shadow-xl">
            {useInlineSuggestions ? <div className="flex flex-col">
                {suggestions.map(item => <button className="flex min-h-8 items-center gap-2 rounded px-2 text-left text-caption text-foreground hover:bg-hover" key={item.path} onClick={() => handleSelectSuggestion(item)}>
                    {item.is_dir ? <Folder size={14} color={textMuted} strokeWidth={1.8} /> : <File size={14} color={textMuted} strokeWidth={1.8} />}
                    <span className="min-w-0 truncate">{item.path}</span>
                  </button>)}
              </div> : <VirtualList<PathCompletion> ref={suggestionsRef} data={suggestions} keyExtractor={item => item.path} className="flex flex-col" nestedScrollEnabled getItemLayout={(_data, index) => ({
          length: 40,
          offset: 40 * index,
          index
        })} onScrollToIndexFailed={handleSuggestionScrollFailure} renderItem={({ item }) => <button className="flex min-h-8 items-center gap-2 rounded px-2 text-left text-caption text-foreground hover:bg-hover" onClick={() => handleSelectSuggestion(item)}>
                    {item.is_dir ? <Folder size={14} color={textMuted} strokeWidth={1.8} /> : <File size={14} color={textMuted} strokeWidth={1.8} />}
                    <span className="min-w-0 truncate">{item.path}</span>
                  </button>} />}
          </div>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-caption font-medium text-text-secondary" htmlFor="workspace-name">项目名称</label>
        <div className="flex h-10 items-center rounded-md border border-border bg-surface-raised px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
          <input id="workspace-name" ref={nameRef} className="w-full bg-transparent text-caption text-foreground outline-none placeholder:text-text-tertiary" value={name} onChange={event => handleNameChange(event.target.value)} onKeyDown={handleNameKeyPress as any} placeholder="例如：My Project" />
        </div>
        {!nameEdited && name.length > 0 && <span className="text-meta text-text-tertiary">已根据路径自动生成</span>}
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button className="rounded-md px-3 py-2 text-caption text-text-secondary hover:bg-hover" onClick={onClose}>取消</button>
        <button className="rounded-md bg-primary px-3 py-2 text-caption font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" onClick={handleCreate} disabled={!canCreate}>添加项目</button>
      </div>
    </>;

  return <AppModal visible={visible} onClose={onClose} contentStyle={!isWideScreen ? { alignSelf: 'end', marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : undefined}>
      {showSuggestions && <button className="fixed inset-0 z-[-1] cursor-default" aria-label="Close suggestions" onClick={dismissSuggestions} />}
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-1"><h2 className="text-title font-semibold text-foreground">新建项目</h2><p className="text-caption text-text-secondary">添加本地目录，随时切换</p></header>
        <div className="flex flex-col gap-4">{formContent}</div>
      </div>
    </AppModal>;
}
