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
      <div className="flex flex-col">
        <span>Workspace Name</span>
        <div>
          <input ref={nameRef} value={name} onChange={event => setName(event.target.value)} onKeyPress={handleKeyPress} placeholder="My Project" />
        </div>
      </div>
      <div className="flex flex-col">
        <span>Path</span>
        <span>{workspace?.path}</span>
      </div>
      <div className="flex flex-col">
        <button onClick={onClose}>
          <span>Cancel</span>
        </button>
        <button onClick={handleSave} disabled={!canSave || saving}>
          <span>
            {saving ? 'Saving...' : 'Save'}
          </span>
        </button>
      </div>
    </>;
}
