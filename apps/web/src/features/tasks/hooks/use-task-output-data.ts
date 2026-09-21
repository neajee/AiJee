import { useEffect } from 'react';
import { useTasksStore } from '../store';

export function useTaskOutputData() {
  const selectedTaskId = useTasksStore((state) => state.selectedTaskId);
  const instances = useTasksStore((state) => state.instances);
  const logsById = useTasksStore((state) => state.logsById);
  const fetchLogs = useTasksStore((state) => state.fetchLogs);

  useEffect(() => {
    if (selectedTaskId) fetchLogs(selectedTaskId);
  }, [selectedTaskId, fetchLogs]);

  return {
    selectedTaskId,
    selectedInstance: instances.find((instance) => instance.id === selectedTaskId),
    selectedLogs: selectedTaskId ? logsById[selectedTaskId] ?? [] : [],
    logsById,
  };
}
