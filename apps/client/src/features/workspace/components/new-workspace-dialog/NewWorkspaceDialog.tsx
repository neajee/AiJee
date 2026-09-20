import { VirtualList } from "@/components/ui/virtual-list";
import { File, Folder } from "lucide-react";
import type { PathCompletion } from "@aijee/client-sdk";
import type { NewWorkspaceController } from "../../hooks/use-new-workspace-controller";
import { styles } from "../../utils/new-workspace-dialog-styles";
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
      {/* Path input */}
      <div className={"  z-[10]"}>
        <span>项目路径</span>
        <div>
          <Folder size={16} color={textMuted} strokeWidth={1.8} />
          <input ref={pathRef} className="min-w-0 flex-1 bg-transparent outline-none" value={path} onChange={event => handlePathChange(event.target.value)} onKeyDown={handlePathKeyPress as any} placeholder="例如：~/work/my-project" onFocus={() => {
          if (path.length > 0) {
            setShowSuggestions(true);
            fetchCompletions(path);
          }
        }} onBlur={useInlineSuggestions ? () => {
          setTimeout(dismissSuggestions, 200);
        } : undefined} />
          {loadingSuggestions && <span className="size-3 animate-spin" />}
        </div>

        {pathPreview && !showSuggestions ? <div className="flex flex-col">
            <span>位置</span>
            <span>
              {pathPreview}
            </span>
          </div> : null}

        {/* Path suggestions popover */}
        {showSuggestions && suggestions.length > 0 && <div>
            {useInlineSuggestions ? <div>
                {suggestions.map((item, index) => <button key={item.path} onClick={() => handleSelectSuggestion(item)}>
                    {item.is_dir ? <Folder size={14} color={textMuted} strokeWidth={1.8} /> : <File size={14} color={textMuted} strokeWidth={1.8} />}
                    <span>
                      {item.path}
                    </span>
                  </button>)}
              </div> : <VirtualList<PathCompletion> ref={suggestionsRef} data={suggestions} keyExtractor={item => item.path} className="flex flex-col" nestedScrollEnabled getItemLayout={(_data, index) => ({
          length: 40,
          offset: 40 * index,
          index
        })} onScrollToIndexFailed={handleSuggestionScrollFailure} renderItem={({
          item,
          index
        }) => <button onClick={() => handleSelectSuggestion(item)}>
                    {item.is_dir ? <Folder size={14} color={textMuted} strokeWidth={1.8} /> : <File size={14} color={textMuted} strokeWidth={1.8} />}
                    <span>
                      {item.path}
                    </span>
                  </button>} />}
          </div>}
      </div>

      {/* Name input */}
      <div className="flex flex-col">
        <span>项目名称</span>
        <div>
          <input ref={nameRef} className="w-full bg-transparent outline-none" value={name} onChange={event => handleNameChange(event.target.value)} onKeyDown={handleNameKeyPress as any} placeholder="例如：My Project" />
        </div>
        {!nameEdited && name.length > 0 && <span>
            已根据路径自动生成
          </span>}
      </div>

      {/* Actions */}
      <div className="flex flex-col">
        <button onClick={onClose}>
          <span>取消</span>
        </button>
        <button onClick={handleCreate} disabled={!canCreate}>
          <span>
            添加项目
          </span>
        </button>
      </div>
    </>;

  return <AppModal visible={visible} onClose={onClose} contentStyle={!isWideScreen ? { alignSelf: 'end', marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : undefined}>
      {showSuggestions && <button className="fixed inset-0 z-[-1] cursor-default" aria-label="Close suggestions" onClick={dismissSuggestions} />}
      <div className="flex flex-col gap-5">
        <header><h2 className="text-lg font-semibold">新建项目</h2><p className="text-sm text-muted-foreground">添加本地目录，随时切换</p></header>
        <div className="flex flex-col gap-4">{formContent}</div>
      </div>
    </AppModal>;
}
