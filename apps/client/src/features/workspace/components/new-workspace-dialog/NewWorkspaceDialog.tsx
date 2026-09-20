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
      <div className={"" + " " + "z-[10]"}>
        <span className={"" + " " + ""}>项目路径</span>
        <div className={"" + " " + ""}>
          <Folder size={16} color={textMuted} strokeWidth={1.8} />
          <input ref={pathRef} className={"" + " " + ""} focusStyle={{
          outlineWidth: 0,
          borderWidth: 0,
          borderColor: 'transparent',
          boxShadow: 'none'
        } as any} value={path} onChangeText={handlePathChange} onKeyPress={handlePathKeyPress} placeholder="例如：~/work/my-project" placeholderTextColor={textMuted} autoCapitalize="none" autoCorrect={false} onFocus={() => {
          if (path.length > 0) {
            setShowSuggestions(true);
            fetchCompletions(path);
          }
        }} onBlur={useInlineSuggestions ? () => {
          setTimeout(dismissSuggestions, 200);
        } : undefined} />
          {loadingSuggestions && <span size="small" color={textMuted} />}
        </div>

        {pathPreview && !showSuggestions ? <div className={""}>
            <span className={"" + " " + ""}>位置</span>
            <span className={"" + " " + ""}>
              {pathPreview}
            </span>
          </div> : null}

        {/* Path suggestions popover */}
        {showSuggestions && suggestions.length > 0 && <div className={(useInlineSuggestions ? "" : "") + " " + ""}>
            {useInlineSuggestions ? <div>
                {suggestions.map((item, index) => <button key={item.path} onClick={() => handleSelectSuggestion(item)}>
                    {item.is_dir ? <Folder size={14} color={textMuted} strokeWidth={1.8} /> : <File size={14} color={textMuted} strokeWidth={1.8} />}
                    <span className={"" + " " + ""}>
                      {item.path}
                    </span>
                  </button>)}
              </div> : <VirtualList<PathCompletion> ref={suggestionsRef} data={suggestions} keyExtractor={item => item.path} className={""} keyboardShouldPersistTaps="handled" nestedScrollEnabled scrollEnabled={suggestions.length > 4} getItemLayout={(_data, index) => ({
          length: 40,
          offset: 40 * index,
          index
        })} onScrollToIndexFailed={handleSuggestionScrollFailure} renderItem={({
          item,
          index
        }) => <button onClick={() => handleSelectSuggestion(item)}>
                    {item.is_dir ? <Folder size={14} color={textMuted} strokeWidth={1.8} /> : <File size={14} color={textMuted} strokeWidth={1.8} />}
                    <span className={"" + " " + ""}>
                      {item.path}
                    </span>
                  </button>} />}
          </div>}
      </div>

      {/* Name input */}
      <div className={""}>
        <span className={"" + " " + ""}>项目名称</span>
        <div className={"" + " " + ""}>
          <input ref={nameRef} className={"" + " " + "" + " " + ""} focusStyle={{
          outlineWidth: 0,
          borderWidth: 0,
          borderColor: 'transparent',
          boxShadow: 'none'
        } as any} value={name} onChangeText={handleNameChange} onKeyPress={handleNameKeyPress} placeholder="例如：My Project" placeholderTextColor={textMuted} />
        </div>
        {!nameEdited && name.length > 0 && <span className={"" + " " + ""}>
            已根据路径自动生成
          </span>}
      </div>

      {/* Actions */}
      <div className={""}>
        <button onClick={onClose}>
          <span className={"" + " " + ""}>取消</span>
        </button>
        <button onClick={handleCreate} disabled={!canCreate}>
          <span className={"" + " " + ""}>
            添加项目
          </span>
        </button>
      </div>
    </>;

  // Narrow: bottom sheet
  if (!isWideScreen) {
    return <div visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <div className={"flex-1"} behavior={false ? 'padding' : undefined}>
          <button className={""} onClick={onClose}>
            <button className={"" + " " + "pb-[0]"} onClick={e => e.stopPropagation()}>
              <div className={""}>
                <div className={"" + " " + ""} />
              </div>
              <span className={"" + " " + ""}>新建项目</span>
              <div className={""} keyboardShouldPersistTaps="handled">
                {formContent}
              </div>
            </button>
          </button>
        </div>
      </div>;
  }

  // Desktop: centered dialog
  return <div visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <button className={""} onClick={onClose}>
        <button className={"" + " " + ""} onClick={e => e.stopPropagation()}>
          {showSuggestions && <button className={"" + " " + "z-[5]"} onClick={dismissSuggestions} />}
          <div className={""}>
            <div className={""}>
              <span className={"" + " " + ""}>新建项目</span>
              <span className={"" + " " + ""}>添加本地目录，随时切换</span>
            </div>
          </div>
          {formContent}
        </button>
      </button>
    </div>;
}
