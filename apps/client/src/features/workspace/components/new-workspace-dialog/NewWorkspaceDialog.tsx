import { VirtualList } from "@/components/ui/virtual-list";
import { File, Folder } from "lucide-react";
import type { PathCompletion } from "@aijee/client-sdk";
import type { NewWorkspaceController } from "../../hooks/use-new-workspace-controller";
import { styles } from "../../utils/new-workspace-dialog-styles";
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
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
          <input ref={pathRef} focusStyle={{
          outlineWidth: 0,
          borderWidth: 0,
          borderColor: 'transparent',
          boxShadow: 'none'
        } as any} value={path} onChange={event => handlePathChange(event.target.value)} onKeyPress={handlePathKeyPress} placeholder="例如：~/work/my-project" onFocus={() => {
          if (path.length > 0) {
            setShowSuggestions(true);
            fetchCompletions(path);
          }
        }} onBlur={useInlineSuggestions ? () => {
          setTimeout(dismissSuggestions, 200);
        } : undefined} />
          {loadingSuggestions && <span className="size-3 animate-spin" />}
        </div>

        {pathPreview && !showSuggestions ? <div className={"block"}>
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
              </div> : <VirtualList<PathCompletion> ref={suggestionsRef} data={suggestions} keyExtractor={item => item.path} className={"block"} keyboardShouldPersistTaps="handled" nestedScrollEnabled scrollEnabled={suggestions.length > 4} getItemLayout={(_data, index) => ({
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
      <div className={"block"}>
        <span>项目名称</span>
        <div>
          <input ref={nameRef} focusStyle={{
          outlineWidth: 0,
          borderWidth: 0,
          borderColor: 'transparent',
          boxShadow: 'none'
        } as any} value={name} onChange={event => handleNameChange(event.target.value)} onKeyPress={handleNameKeyPress} placeholder="例如：My Project" />
        </div>
        {!nameEdited && name.length > 0 && <span>
            已根据路径自动生成
          </span>}
      </div>

      {/* Actions */}
      <div className={"block"}>
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

  // Narrow: bottom sheet
  if (!isWideScreen) {
    return <div visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <div className={"flex-1"} behavior={false ? 'padding' : undefined}>
          <button className={"block"} onClick={onClose}>
            <button className={"  pb-0"} onClick={e => e.stopPropagation()}>
              <div className={"block"}>
                <div />
              </div>
              <span>新建项目</span>
              <div className={"block"} keyboardShouldPersistTaps="handled">
                {formContent}
              </div>
            </button>
          </button>
        </div>
      </div>;
  }

  // Desktop: centered dialog
  return <div visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <button className={"block"} onClick={onClose}>
        <button onClick={e => e.stopPropagation()}>
          {showSuggestions && <button className={"  z-[5]"} onClick={dismissSuggestions} />}
          <div className={"block"}>
            <div className={"block"}>
              <span>新建项目</span>
              <span>添加本地目录，随时切换</span>
            </div>
          </div>
          {formContent}
        </button>
      </button>
    </div>;
}
