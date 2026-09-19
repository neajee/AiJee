import { toTailwind } from "@/styles/to-tailwind";
import { styles } from './style-tokens';
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
      <div className={toTailwind(styles.field)}>
        <span className={toTailwind([styles.label, {
        color: textMuted
      }])}>Workspace Name</span>
        <div className={toTailwind([styles.inputRow, {
        backgroundColor: inputBg,
        borderColor: inputBorder
      }])}>
          <input ref={nameRef} className={toTailwind([styles.input, {
          color: textPrimary
        }])} value={name} onChangeText={setName} onKeyPress={handleKeyPress} placeholder="My Project" placeholderTextColor={textMuted} />
        </div>
      </div>
      <div className={toTailwind(styles.field)}>
        <span className={toTailwind([styles.label, {
        color: textMuted
      }])}>Path</span>
        <span className={toTailwind([styles.pathText, {
        color: textPrimary
      }])}>{workspace?.path}</span>
      </div>
      <div className={toTailwind(styles.actions)}>
        <button onClick={onClose}>
          <span className={toTailwind([styles.cancelText, {
          color: textPrimary
        }])}>Cancel</span>
        </button>
        <button onClick={handleSave} disabled={!canSave || saving}>
          <span className={toTailwind([styles.saveText, {
          color: canSave ? isDark ? '#121212' : '#FFFFFF' : textMuted
        }])}>
            {saving ? 'Saving...' : 'Save'}
          </span>
        </button>
      </div>
    </>;
}
