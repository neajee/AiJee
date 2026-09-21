import { useEffect } from 'react';
import { Play, Square, ChevronDown } from 'lucide-react';
import { Fonts } from '@/constants/theme';
import { useTasksStore } from '../store';
import { useWorkspaceStore } from '@/features/workspace/store';
import { TasksDropdown } from './tasks-panel/TasksDropdown';
export function TaskSelector({
  placement = 'below'
}: {
  /** Passed to the dropdown: the composer toolbar has to open upwards. */
  placement?: 'below' | 'above';
}) {
  const panelOpen = useTasksStore(s => s.panelOpen);
  const togglePanel = useTasksStore(s => s.togglePanel);
  const instances = useTasksStore(s => s.instances);
  const definitions = useTasksStore(s => s.definitions);
  const hasConfig = useTasksStore(s => s.hasConfig);
  const selectedTaskLabel = useTasksStore(s => s.selectedTaskLabel);
  const fetchConfig = useTasksStore(s => s.fetchConfig);
  const fetchInstances = useTasksStore(s => s.fetchInstances);
  const startTask = useTasksStore(s => s.startTask);
  const stopTask = useTasksStore(s => s.stopTask);
  const workspace = useWorkspaceStore(s => s.workspaces.find(w => w.id === s.selectedWorkspaceId));
  useEffect(() => {
    if (workspace?.id) {
      fetchConfig(workspace.id);
      fetchInstances(workspace.id);
    }
  }, [workspace?.id, fetchConfig, fetchInstances]);
  if (!hasConfig && instances.length === 0) return null;
  const selectedDef = definitions.find(d => d.label === selectedTaskLabel);
  // A label can have several instances (e.g. an old stopped one plus a fresh
  // run). Always act on the running one so the toggle matches the icon.
  const selectedInstance = instances.find(i => i.label === selectedTaskLabel && i.status === 'running') ?? instances.find(i => i.label === selectedTaskLabel);
  const isRunning = selectedInstance?.status === 'running';
  const displayLabel = selectedTaskLabel ?? 'No task';
  const handleToggle = () => {
    if (!selectedTaskLabel || !workspace?.id) return;
    if (isRunning && selectedInstance) {
      stopTask(selectedInstance.id);
    } else {
      startTask(selectedTaskLabel, workspace.id);
    }
  };
  return <div className="flex flex-col">
      <div className="flex flex-col">
        <button onClick={handleToggle} disabled={!selectedTaskLabel} className="inline-flex items-center" aria-label={isRunning ? 'Stop task' : 'Start task'}>
          {isRunning ? <Square size={10} color="#FF3B30" fill="#FF3B30" strokeWidth={0} /> : <Play size={10} color="#34C759" fill="#34C759" strokeWidth={0} />}
        </button>

        <button onClick={togglePanel} className="inline-flex items-center" aria-label="Select task">
          <span className="inline-block">
            {displayLabel}
          </span>
          <ChevronDown size={10} color="#888" strokeWidth={2} />
        </button>
      </div>

      {panelOpen && <TasksDropdown placement={placement} />}
    </div>;
}