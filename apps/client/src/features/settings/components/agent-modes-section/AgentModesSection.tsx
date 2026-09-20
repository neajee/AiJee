import { Fonts } from '@/constants/theme';
import { useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import { useAgentModesController } from '../../hooks/use-agent-modes-controller';

/** A single, calm surface for instructions that shape every agent session. */
export function AgentModesSection({
  isDark: _isDark,
  isNative
}: {
  isDark: boolean;
  isNative?: boolean;
}) {
  const palette = useSettingsPalette();
  const phone = useSettingsPhoneLayout();
  const roomy = isNative ?? phone;
  const {
    loaded,
    value,
    setValue,
    saving,
    changed,
    save
  } = useAgentModesController();
  if (!loaded) return null;
  return <div className={" "}>
      <div className={" "}>
        <div className={"block"}>
          <span className={"  text-foreground"}>自定义指令</span>
          <span className={"  text-text-tertiary"}>向智能体提供适用于此主机上所有聊天的额外说明和上下文。</span>
        </div>
        <button onClick={save} disabled={!changed || saving} role="button" aria-label="保存自定义指令">
          <span className={" "}>{saving ? '保存中' : '保存'}</span>
        </button>
      </div>
      <textarea value={value} onChangeText={setValue} multiline textAlignVertical="top" placeholder="例如：回答时保持简洁；先说明结论，再给出关键步骤。" placeholderTextColor={palette.textTertiary} aria-label="自定义指令" className={"  text-foreground bg-muted border-border"} />
      <span className={"  text-text-tertiary"}>保存后，新建或重新载入的智能体会应用这些指令。</span>
    </div>;
}
const styles = {
  wrap: {
    width: '100%',
    alignSelf: 'stretch',
    gap: 12
  },
  wrapRoomy: {
    gap: 14
  },
  topline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16
  },
  toplineRoomy: {
    gap: 24
  },
  copy: {
    flex: 1,
    gap: 4
  },
  title: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'left'
  },
  description: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'left'
  },
  save: {
    minWidth: 52,
    minHeight: 32,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveDisabled: {
    opacity: 0.7
  },
  savePressed: {
    opacity: 0.82
  },
  saveText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    textAlign: 'left'
  },
  editor: {
    minHeight: 148,
    paddingLeft: 13,
    paddingRight: 13,
    paddingTop: 11,
    paddingBottom: 11,
    borderWidth: 0.5,
    borderRadius: 9,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 21
  },
  editorRoomy: {
    minHeight: 172,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 14,
    lineHeight: 22,
    borderRadius: 10
  },
  hint: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'left'
  }
} as const;
