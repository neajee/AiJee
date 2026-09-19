import { toTailwind } from "@/styles/to-tailwind";
import { Layers } from 'lucide-react';
import { AppModal } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useModePickerController } from '../../hooks/use-mode-picker-controller';
import { ModeOption } from './mode-option';
import { styles } from './style-tokens';
import type { ModePickerDialogProps } from './component-types';
export function ModePickerDialog({
  visible,
  modes,
  onSelect,
  onSkip
}: ModePickerDialogProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const {
    selectedId,
    setSelectedId,
    handleConfirm,
    noModeId
  } = useModePickerController(modes, onSelect, onSkip);
  const bg = isDark ? '#1e1e1c' : '#FFFFFF';
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const textMuted = isDark ? '#cdc8c5' : '#888';
  const borderColor = isDark ? '#2a2a2a' : 'rgba(0,0,0,0.1)';
  const selectedBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const selectedBorder = isDark ? '#555' : '#aaa';
  return <AppModal visible={visible} onClose={onSkip} contentStyle={[styles.dialog, {
    backgroundColor: bg,
    borderColor
  }]}>
      <div className={toTailwind(styles.header)}><Layers size={18} color={textPrimary} strokeWidth={1.8} /><span className={toTailwind([styles.title, {
        color: textPrimary
      }])}>Select Mode</span></div>
      <span className={toTailwind([styles.subtitle, {
      color: textMuted
    }])}>Choose how the agent should be configured for this session.</span>
      <div className={toTailwind(styles.list)}>
        <ModeOption selected={selectedId === noModeId} borderColor={borderColor} selectedBg={selectedBg} selectedBorder={selectedBorder} textPrimary={textPrimary} textMuted={textMuted} onClick={() => setSelectedId(noModeId)} />
        {modes.map(mode => <ModeOption key={mode.id} mode={mode} selected={selectedId === mode.id} borderColor={borderColor} selectedBg={selectedBg} selectedBorder={selectedBorder} textPrimary={textPrimary} textMuted={textMuted} onClick={() => setSelectedId(mode.id)} />)}
      </div>
      <div className={toTailwind(styles.footer)}>
        <button onClick={handleConfirm}>
          <span className={toTailwind([styles.btnText, {
          color: isDark ? '#1a1a1a' : '#fff'
        }])}>Start Session</span>
        </button>
      </div>
    </AppModal>;
}
