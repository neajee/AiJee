import { AppSheet } from '@/components/ui';
import { TasksPanelContent } from './tasks-panel/content';
interface TasksSheetProps {
  visible: boolean;
  onClose: () => void;
}
export function TasksSheet({
  visible,
  onClose
}: TasksSheetProps) {
  return <AppSheet visible={visible} onClose={onClose} title="Tasks" height={480}>
    <TasksPanelContent />
  </AppSheet>;
}
