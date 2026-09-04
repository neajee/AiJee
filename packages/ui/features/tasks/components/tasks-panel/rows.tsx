import { Pressable, Text, View } from 'react-native';
import { Circle, Play, RotateCcw, Square, Trash2 } from 'lucide-react-native';
import type { TaskDefinition, TaskInfo } from '@aijee/client-sdk';
import { styles } from './styles';

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
  pi: '#8B5CF6',
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
  pi: 'pi',
};

function SourceBadge({ source, isDark }: { source: string; isDark: boolean }) {
  const bg = SOURCE_COLORS[source] ?? (isDark ? '#555' : '#999');
  const label = SOURCE_LABELS[source] ?? source;
  const textColor = source === 'bun' ? '#000' : '#fff';
  return (
    <View style={[styles.sourceBadge, { backgroundColor: bg }]}>
      <Text style={[styles.sourceBadgeText, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}

function StatusDot({ status }: { status: TaskInfo['status'] }) {
  const color =
    status === 'running'
      ? '#34C759'
      : status === 'failed'
        ? '#FF3B30'
        : '#8E8E93';
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
  isDark,
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
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed, hovered }: any) => [
        styles.taskRow,
        isSelected && {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
        (pressed || hovered) && { backgroundColor: hoverBg },
      ]}
    >
      <StatusDot status={instance.status} />
      <SourceBadge source={instance.source ?? 'pi'} isDark={isDark} />
      <View style={styles.taskRowInfo}>
        <Text style={[styles.taskRowLabel, { color: textPrimary }]} numberOfLines={1}>
          {instance.label}
        </Text>
        <Text style={[styles.taskRowCmd, { color: textMuted }]} numberOfLines={1}>
          {instance.command}
        </Text>
      </View>
      <View style={styles.taskRowActions}>
        {instance.status === 'running' ? (
          <>
            <Pressable onPress={onRestart} style={styles.actionBtn} accessibilityLabel="Restart task">
              <RotateCcw size={12} color={textMuted} strokeWidth={2} />
            </Pressable>
            <Pressable onPress={onStop} style={styles.actionBtn} accessibilityLabel="Stop task">
              <Square size={12} color="#FF3B30" strokeWidth={2} />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={onRestart} style={styles.actionBtn} accessibilityLabel="Restart task">
              <Play size={12} color="#34C759" strokeWidth={2} />
            </Pressable>
            <Pressable onPress={onRemove} style={styles.actionBtn} accessibilityLabel="Remove task">
              <Trash2 size={12} color={textMuted} strokeWidth={2} />
            </Pressable>
          </>
        )}
      </View>
    </Pressable>
  );
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
  isDark,
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
  return (
    <Pressable
      onPress={onSelect}
      disabled={loading}
      style={({ pressed, hovered }: any) => [
        styles.taskRow,
        isSelected && {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
        (pressed || hovered) && { backgroundColor: hoverBg },
        loading && { opacity: 0.5 },
      ]}
    >
      <SourceBadge source={definition.source ?? 'pi'} isDark={isDark} />
      <View style={styles.taskRowInfo}>
        <Text style={[styles.taskRowLabel, { color: textPrimary }]} numberOfLines={1}>
          {definition.label}
        </Text>
        <Text style={[styles.taskRowCmd, { color: textMuted }]} numberOfLines={1}>
          {definition.command}
        </Text>
      </View>
      {definition.group && (
        <View style={[styles.groupBadge, { borderColor: textMuted }]}>
          <Text style={[styles.groupBadgeText, { color: textMuted }]}>
            {definition.group}
          </Text>
        </View>
      )}
      <Pressable
        onPress={onStart}
        disabled={loading}
        style={styles.actionBtn}
        accessibilityLabel="Start task"
      >
        <Play size={12} color="#34C759" strokeWidth={2.5} />
      </Pressable>
    </Pressable>
  );
}
