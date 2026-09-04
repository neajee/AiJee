import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTasksStore } from '../../store';
import { useWorkspaceStore } from '@/features/workspace/store';
import { AvailableTaskRow, TaskInstanceRow } from './rows';
import { styles } from './styles';

export function TasksPanelContent() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const hoverBg = isDark ? '#333' : '#F5F5F5';

  const definitions = useTasksStore((s) => s.definitions);
  const instances = useTasksStore((s) => s.instances);
  const selectedTaskLabel = useTasksStore((s) => s.selectedTaskLabel);
  const setSelectedTaskLabel = useTasksStore((s) => s.setSelectedTaskLabel);
  const startTask = useTasksStore((s) => s.startTask);
  const stopTask = useTasksStore((s) => s.stopTask);
  const restartTask = useTasksStore((s) => s.restartTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const loading = useTasksStore((s) => s.loading);
  const setSelectedTaskId = useTasksStore((s) => s.setSelectedTaskId);
  const setOutputPanelVisible = useTasksStore((s) => s.setOutputPanelVisible);
  const setPanelOpen = useTasksStore((s) => s.setPanelOpen);

  const workspace = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.selectedWorkspaceId),
  );
  const workspaceId = workspace?.id ?? '';

  const fetchConfig = useTasksStore((s) => s.fetchConfig);
  const fetchInstances = useTasksStore((s) => s.fetchInstances);

  const [expandedSection, setExpandedSection] = useState<'available' | 'running' | null>(
    instances.length > 0 ? 'running' : 'available',
  );

  useEffect(() => {
    if (workspaceId) {
      fetchConfig(workspaceId);
      fetchInstances(workspaceId);
    }
  }, [workspaceId, fetchConfig, fetchInstances]);

  useEffect(() => {
    if (instances.length > 0 && expandedSection === null) {
      setExpandedSection('running');
    } else if (instances.length === 0 && expandedSection === 'running') {
      setExpandedSection('available');
    }
  }, [instances.length]);

  const handleStart = useCallback(
    (label: string) => {
      startTask(label, workspaceId);
      setPanelOpen(false);
    },
    [startTask, workspaceId, setPanelOpen],
  );

  const handleStop = useCallback(
    (taskId: string) => { stopTask(taskId); },
    [stopTask],
  );

  const handleRestart = useCallback(
    (taskId: string) => { restartTask(taskId); },
    [restartTask],
  );

  const handleRemove = useCallback(
    (taskId: string) => { removeTask(taskId); },
    [removeTask],
  );

  const handleSelectTask = useCallback(
    (label: string, instanceId?: string) => {
      setSelectedTaskLabel(label);
      if (instanceId) {
        setSelectedTaskId(instanceId);
        setOutputPanelVisible(true);
      }
      setPanelOpen(false);
    },
    [setSelectedTaskLabel, setSelectedTaskId, setOutputPanelVisible, setPanelOpen],
  );

  const runningLabels = new Set(
    instances.filter((i) => i.status === 'running').map((i) => i.label),
  );
  const availableTasks = definitions.filter(
    (d) => !runningLabels.has(d.label),
  );

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.listContent} bounces={false}>
      {instances.length > 0 && (
        <>
          <Pressable
            onPress={() =>
              setExpandedSection(expandedSection === 'running' ? null : 'running')
            }
            style={styles.sectionHeader}
          >
            {expandedSection === 'running' ? (
              <ChevronDown size={12} color={textMuted} strokeWidth={2} />
            ) : (
              <ChevronRight size={12} color={textMuted} strokeWidth={2} />
            )}
            <Text style={[styles.sectionTitle, { color: textMuted }]}>
              ACTIVE ({instances.length})
            </Text>
          </Pressable>
          {expandedSection === 'running' &&
            instances.map((instance) => (
              <TaskInstanceRow
                key={instance.id}
                instance={instance}
                isSelected={instance.label === selectedTaskLabel}
                onSelect={() => handleSelectTask(instance.label, instance.id)}
                onStop={() => handleStop(instance.id)}
                onRestart={() => handleRestart(instance.id)}
                onRemove={() => handleRemove(instance.id)}
                textPrimary={textPrimary}
                textMuted={textMuted}
                hoverBg={hoverBg}
                isDark={isDark}
              />
            ))
          }
        </>
      )}

      {availableTasks.length > 0 && (
        <>
          <Pressable
            onPress={() =>
              setExpandedSection(expandedSection === 'available' ? null : 'available')
            }
            style={styles.sectionHeader}
          >
            {expandedSection === 'available' ? (
              <ChevronDown size={12} color={textMuted} strokeWidth={2} />
            ) : (
              <ChevronRight size={12} color={textMuted} strokeWidth={2} />
            )}
            <Text style={[styles.sectionTitle, { color: textMuted }]}>
              AVAILABLE ({availableTasks.length})
            </Text>
          </Pressable>
          {expandedSection === 'available' &&
            availableTasks.map((def) => (
              <AvailableTaskRow
                key={def.label}
                definition={def}
                isSelected={def.label === selectedTaskLabel}
                onSelect={() => handleSelectTask(def.label)}
                onStart={() => handleStart(def.label)}
                textPrimary={textPrimary}
                textMuted={textMuted}
                hoverBg={hoverBg}
                loading={loading}
                isDark={isDark}
              />
            ))
          }
        </>
      )}

      {instances.length === 0 && availableTasks.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: textMuted }]}>
            No tasks configured.{'\n'}Add .pi/tasks.json to your workspace.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
