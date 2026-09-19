import { toTailwind } from "@/styles/to-tailwind";
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
      <div className={toTailwind([styles.field, {
      zIndex: 10
    }])}>
        <span className={toTailwind([styles.label, {
        color: textMuted
      }])}>项目路径</span>
        <div className={toTailwind([styles.inputRow, {
        backgroundColor: inputBg,
        borderColor: inputBorder
      }])}>
          <Folder size={16} color={textMuted} strokeWidth={1.8} />
          <input ref={pathRef} className={toTailwind([styles.input, {
          color: textPrimary
        }])} focusStyle={{
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

        {pathPreview && !showSuggestions ? <div className={toTailwind(styles.pathPreview)}>
            <span className={toTailwind([styles.pathPreviewLabel, {
          color: textMuted
        }])}>位置</span>
            <span className={toTailwind([styles.pathPreviewValue, {
          color: textPrimary
        }])}>
              {pathPreview}
            </span>
          </div> : null}

        {/* Path suggestions popover */}
        {showSuggestions && suggestions.length > 0 && <div className={toTailwind([useInlineSuggestions ? styles.inlineSuggestionsPopover : styles.suggestionsPopover, {
        backgroundColor: popoverBg,
        borderColor: inputBorder
      }])}>
            {useInlineSuggestions ? <div>
                {suggestions.map((item, index) => <button key={item.path} onClick={() => handleSelectSuggestion(item)}>
                    {item.is_dir ? <Folder size={14} color={textMuted} strokeWidth={1.8} /> : <File size={14} color={textMuted} strokeWidth={1.8} />}
                    <span className={toTailwind([styles.suggestionText, {
              color: textPrimary
            }])}>
                      {item.path}
                    </span>
                  </button>)}
              </div> : <VirtualList<PathCompletion> ref={suggestionsRef} data={suggestions} keyExtractor={item => item.path} className={toTailwind(styles.suggestionsScroll)} keyboardShouldPersistTaps="handled" nestedScrollEnabled scrollEnabled={suggestions.length > 4} getItemLayout={(_data, index) => ({
          length: 40,
          offset: 40 * index,
          index
        })} onScrollToIndexFailed={handleSuggestionScrollFailure} renderItem={({
          item,
          index
        }) => <button onClick={() => handleSelectSuggestion(item)}>
                    {item.is_dir ? <Folder size={14} color={textMuted} strokeWidth={1.8} /> : <File size={14} color={textMuted} strokeWidth={1.8} />}
                    <span className={toTailwind([styles.suggestionText, {
            color: textPrimary
          }])}>
                      {item.path}
                    </span>
                  </button>} />}
          </div>}
      </div>

      {/* Name input */}
      <div className={toTailwind(styles.field)}>
        <span className={toTailwind([styles.label, {
        color: textMuted
      }])}>项目名称</span>
        <div className={toTailwind([styles.inputRow, {
        backgroundColor: inputBg,
        borderColor: inputBorder
      }])}>
          <input ref={nameRef} className={toTailwind([styles.input, styles.nameInput, {
          color: textPrimary
        }])} focusStyle={{
          outlineWidth: 0,
          borderWidth: 0,
          borderColor: 'transparent',
          boxShadow: 'none'
        } as any} value={name} onChangeText={handleNameChange} onKeyPress={handleNameKeyPress} placeholder="例如：My Project" placeholderTextColor={textMuted} />
        </div>
        {!nameEdited && name.length > 0 && <span className={toTailwind([styles.hint, {
        color: textMuted
      }])}>
            已根据路径自动生成
          </span>}
      </div>

      {/* Actions */}
      <div className={toTailwind(styles.actions)}>
        <button onClick={onClose}>
          <span className={toTailwind([styles.cancelText, {
          color: textPrimary
        }])}>取消</span>
        </button>
        <button onClick={handleCreate} disabled={!canCreate}>
          <span className={toTailwind([styles.createText, {
          color: canCreate ? isDark ? '#121212' : '#FFFFFF' : textMuted
        }])}>
            添加项目
          </span>
        </button>
      </div>
    </>;

  // Narrow: bottom sheet
  if (!isWideScreen) {
    return <div visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <div className={toTailwind({
        flex: 1
      })} behavior={false ? 'padding' : undefined}>
          <button className={toTailwind(styles.sheetOverlay)} onClick={onClose}>
            <button className={toTailwind([styles.sheetContainer, {
            backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
            paddingBottom: insets.bottom + 20
          }])} onClick={e => e.stopPropagation()}>
              <div className={toTailwind(styles.sheetHandle)}>
                <div className={toTailwind([styles.sheetHandleBar, {
                backgroundColor: isDark ? '#555' : '#CCC'
              }])} />
              </div>
              <span className={toTailwind([styles.sheetTitle, {
              color: textPrimary
            }])}>新建项目</span>
              <div className={toTailwind(styles.sheetBody)} keyboardShouldPersistTaps="handled">
                {formContent}
              </div>
            </button>
          </button>
        </div>
      </div>;
  }

  // Desktop: centered dialog
  return <div visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <button className={toTailwind(styles.overlay)} onClick={onClose}>
        <button className={toTailwind([styles.dialog, {
        backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
        borderColor: inputBorder
      }])} onClick={e => e.stopPropagation()}>
          {showSuggestions && <button className={toTailwind([ABSOLUTE_FILL_STYLE, {
          zIndex: 5
        }])} onClick={dismissSuggestions} />}
          <div className={toTailwind(styles.header)}>
            <div className={toTailwind(styles.headerCopy)}>
              <span className={toTailwind([styles.title, {
              color: textPrimary
            }])}>新建项目</span>
              <span className={toTailwind([styles.subtitle, {
              color: textMuted
            }])}>添加本地目录，随时切换</span>
            </div>
          </div>
          {formContent}
        </button>
      </button>
    </div>;
}
