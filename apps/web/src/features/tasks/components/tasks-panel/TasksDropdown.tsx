import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTasksStore } from '../../store';
import { TasksPanelContent } from './content';
interface TasksDropdownProps {
  /**
   * Where the panel opens relative to its trigger. The composer toolbar sits at
   * the bottom of the screen, so it needs the panel above the trigger.
   */
  placement?: "below" | "above";
}
export function TasksDropdown({
  placement = "below"
}: TasksDropdownProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const popoverBg = isDark ? '#252525' : '#FFFFFF';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const setPanelOpen = useTasksStore(s => s.setPanelOpen);
  useEffect(() => {
    if (false) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-tasks-panel]')) {
        setPanelOpen(false);
      }
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [setPanelOpen]);
  return <div {...{
    'data-tasks-panel': true
  } as any}>
      <div>
        <span>Tasks</span>
        <button onClick={() => setPanelOpen(false)} className="inline-flex items-center">
          <X size={14} color={textMuted} strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-col">
        <TasksPanelContent />
      </div>
    </div>;
}