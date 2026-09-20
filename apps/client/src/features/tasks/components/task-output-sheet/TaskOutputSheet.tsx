import { useEffect, useRef } from 'react';
import { Circle, X } from 'lucide-react';
import { useTaskOutputData } from '../../hooks/use-task-output-data';
import { useSheetHeight } from '@/features/navigation/hooks/use-sheet-height';
interface TaskOutputSheetProps {
  visible: boolean;
  onClose: () => void;
}
export function TaskOutputSheet({
  visible,
  onClose
}: TaskOutputSheetProps) {
  const {
    selectedTaskId,
    selectedInstance,
    selectedLogs,
    logsById
  } = useTaskOutputData();
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Adapt to the viewport so the sheet never over-covers short screens nor
  // under-covers tall ones (the old fixed 400 px caused the layout anomaly).
  const sheetHeight = useSheetHeight({
    fraction: 0.55,
    min: 320,
    max: 440
  });
  useEffect(() => {
    if (selectedTaskId && logScrollRef.current) {
      requestAnimationFrame(() => logScrollRef.current?.scrollTo({ top: logScrollRef.current.scrollHeight }));
    }
  }, [selectedTaskId, logsById]);
  const statusColor = selectedInstance?.status === 'running' ? '#34C759' : selectedInstance?.status === 'failed' ? '#FF3B30' : '#8E8E93';
  if (!visible) return null;
  return <div className="fixed inset-0 z-50 bg-black/50" role="dialog" aria-modal="true">
      <button className="absolute inset-0 size-full cursor-default" aria-label="Close task output" onClick={onClose} />
      <section className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl" style={{ height: sheetHeight }}>
        <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            {selectedInstance ? <>
              <div className="flex items-center gap-2"><Circle size={8} color={statusColor} fill={statusColor} strokeWidth={0} /><span className="font-medium">{selectedInstance.label}</span></div>
              <p className="truncate text-xs text-muted-foreground">{selectedInstance.command}</p>
            </> : <span className="font-medium">Task Output</span>}
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-hover" aria-label="Close task output"><X size={18} /></button>
        </header>
        <div ref={logScrollRef} className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-muted/40 p-4 font-mono text-xs">
          {selectedLogs.length === 0 ? <span>
              {selectedInstance ? 'No output yet...' : 'Select a running task to view output'}
            </span> : selectedLogs.map((line, i) => <span key={i}>
                {line}
              </span>)}
        </div>
      </section>
    </div>;
}
