import type { EditWorkspaceFormProps } from './component-types';
export function EditWorkspaceForm({
  workspace,
  isDark,
  colors,
  textPrimary,
  textMuted,
  inputBg,
  inputBorder,
  name,
  setName,
  saving,
  canSave,
  nameRef,
  handleSave,
  handleKeyPress,
  onClose
}: EditWorkspaceFormProps) {
  return <>
      <div className={"block"}>
        <span className={" "}>Workspace Name</span>
        <div className={" "}>
          <input ref={nameRef} className={" "} value={name} onChangeText={setName} onKeyPress={handleKeyPress} placeholder="My Project" placeholderTextColor={textMuted} />
        </div>
      </div>
      <div className={"block"}>
        <span className={" "}>Path</span>
        <span className={" "}>{workspace?.path}</span>
      </div>
      <div className={"block"}>
        <button onClick={onClose}>
          <span className={" "}>Cancel</span>
        </button>
        <button onClick={handleSave} disabled={!canSave || saving}>
          <span className={" "}>
            {saving ? 'Saving...' : 'Save'}
          </span>
        </button>
      </div>
    </>;
}
