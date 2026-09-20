import { Circle, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import type { TaskDefinition, TaskInfo } from '@aijee/client-sdk';
const SOURCE_COLORS: Record<string, string> = {
  npm: '#CB3837',
  yarn: '#2C8EBB',
  pnpm: '#F69220',
  bun: '#FBF0DF',
  make: '#6D8086',
  cargo: '#CE412B',
  docker: '#2496ED',
  python: '#3776AB',
  rake: '#CC342D',
  gradle: '#02303A',
  deno: '#000000',
  pi: '#8B5CF6'
};
const SOURCE_LABELS: Record<string, string> = {
  npm: 'npm',
  yarn: 'yarn',
  pnpm: 'pnpm',
  bun: 'bun',
  make: 'make',
  cargo: 'cargo',
  docker: 'docker',
  python: 'py',
  rake: 'rake',
  gradle: 'gradle',
  deno: 'deno',
  pi: 'pi'
};
function SourceBadge({
  source,
  isDark
}: {
  source: string;
  isDark: boolean;
}) {
  const bg = SOURCE_COLORS[source] ?? (isDark ? '#555' : '#999');
  const label = SOURCE_LABELS[source] ?? source;
  const textColor = source === 'bun' ? '#000' : '#fff';
  return <div>
      <span>
        {label}
      </span>
    </div>;
}
function StatusDot({
  status
}: {
  status: TaskInfo['status'];
}) {
  const color = status === 'running' ? '#34C759' : status === 'failed' ? '#FF3B30' : '#8E8E93';
  return <Circle size={8} color={color} fill={color} strokeWidth={0} />;
}
export function TaskInstanceRow({
  instance,
  isSelected,
  onSelect,
  onStop,
  onRestart,
  onRemove,
  textPrimary,
  textMuted,
  hoverBg,
  isDark
}: {
  instance: TaskInfo;
  isSelected: boolean;
  onSelect: () => void;
  onStop: () => void;
  onRestart: () => void;
  onRemove: () => void;
  textPrimary: string;
  textMuted: string;
  hoverBg: string;
  isDark: boolean;
}) {
  return <button onClick={onSelect} className="inline-flex items-center">
      <StatusDot status={instance.status} />
      <SourceBadge source={instance.source ?? 'pi'} isDark={isDark} />
      <div className="flex flex-col">
        <span>
          {instance.label}
        </span>
        <span>
          {instance.command}
        </span>
      </div>
      <div className="flex flex-col">
        {instance.status === 'running' ? <>
            <button onClick={onRestart} className="inline-flex items-center" aria-label="Restart task">
              <RotateCcw size={12} color={textMuted} strokeWidth={2} />
            </button>
            <button onClick={onStop} className="inline-flex items-center" aria-label="Stop task">
              <Square size={12} color="#FF3B30" strokeWidth={2} />
            </button>
          </> : <>
            <button onClick={onRestart} className="inline-flex items-center" aria-label="Restart task">
              <Play size={12} color="#34C759" strokeWidth={2} />
            </button>
            <button onClick={onRemove} className="inline-flex items-center" aria-label="Remove task">
              <Trash2 size={12} color={textMuted} strokeWidth={2} />
            </button>
          </>}
      </div>
    </button>;
}
export function AvailableTaskRow({
  definition,
  isSelected,
  onSelect,
  onStart,
  textPrimary,
  textMuted,
  hoverBg,
  loading,
  isDark
}: {
  definition: TaskDefinition;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
  textPrimary: string;
  textMuted: string;
  hoverBg: string;
  loading: boolean;
  isDark: boolean;
}) {
  return <button onClick={onSelect} disabled={loading} className="inline-flex items-center">
      <SourceBadge source={definition.source ?? 'pi'} isDark={isDark} />
      <div className="flex flex-col">
        <span>
          {definition.label}
        </span>
        <span>
          {definition.command}
        </span>
      </div>
      {definition.group && <div>
          <span>
            {definition.group}
          </span>
        </div>}
      <button onClick={onStart} disabled={loading} className="inline-flex items-center" aria-label="Start task">
        <Play size={12} color="#34C759" strokeWidth={2.5} />
      </button>
    </button>;
}
