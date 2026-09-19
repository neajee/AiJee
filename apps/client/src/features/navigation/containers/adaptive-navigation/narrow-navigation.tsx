import type { ReactNode } from 'react';
import { GestureHandlerRootView } from "@/components/dom";
import { SafeAreaView } from "@/components/dom";
import { View } from "@/components/dom";

import { NarrowHeaderBar } from '../../components/narrow-header-bar';
import { WorkspaceSheet } from '../../components/workspace-sheet';
import { NarrowChangesSheet } from '../../components/narrow-changes-sheet';
import { NarrowFilesSheet } from '../../components/narrow-files-sheet';
import { NarrowPreviewSheet } from '../../components/narrow-preview-sheet';
import { ConnectionStatusBanner } from '@/features/agent/components/connection-status-banner';
import { TasksSheet } from '@/features/tasks/components/tasks-sheet';
import { TaskOutputSheet } from '@/features/tasks/components/task-output-sheet';
import { styles } from './styles';
import type { useAdaptiveNavigationController } from './use-adaptive-navigation-controller';

type Controller = ReturnType<typeof useAdaptiveNavigationController>;

export function NarrowNavigation({ children, colors, controller }: { children: ReactNode; colors: ReturnType<typeof import('@/hooks/use-theme-tokens').useThemeTokens>; controller: Controller }) {
  const {
    hasServer,
    hasWorkspaces,
    isCodeMode,
    openSessionId,
    sheetVisible,
    setSheetVisible,
    changesSheetVisible,
    setChangesSheetVisible,
    filesSheetVisible,
    setFilesSheetVisible,
    previewSheetVisible,
    setPreviewSheetVisible,
    tasksSheetVisible,
    setTasksSheetVisible,
    taskOutputSheetVisible,
    setTaskOutputSheetVisible,
    openFiles,
    openGit,
    openPreview,
  } = controller;

  return (
    <GestureHandlerRootView style={[styles.narrowContainer, { backgroundColor: colors.background }]}>
      <SafeAreaView style={[styles.narrowSafeArea, { backgroundColor: colors.background }]} edges={['top']}>
        {hasServer && (
          <NarrowHeaderBar
            onWorkspacePress={() => setSheetVisible(true)}
            onFilesPress={openFiles}
            onGitPress={openGit}
            onPreviewPress={openPreview}
            onTasksPress={() => setTasksSheetVisible(true)}
            onTaskOutputPress={() => setTaskOutputSheetVisible(true)}
          />
        )}
        <View style={styles.narrowContent}>{children}</View>
        {hasServer && <ConnectionStatusBanner />}
      </SafeAreaView>
      {hasServer && isCodeMode && (
        <>
          <WorkspaceSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
          {hasWorkspaces && (
            <>
              <NarrowChangesSheet visible={changesSheetVisible} onClose={() => setChangesSheetVisible(false)} />
              <NarrowPreviewSheet
                visible={previewSheetVisible}
                onClose={() => setPreviewSheetVisible(false)}
                sessionId={openSessionId}
              />
            </>
          )}
        </>
      )}
      {isCodeMode && (
        <>
          <TasksSheet visible={tasksSheetVisible} onClose={() => setTasksSheetVisible(false)} />
          <TaskOutputSheet visible={taskOutputSheetVisible} onClose={() => setTaskOutputSheetVisible(false)} />
        </>
      )}
      {hasServer && <NarrowFilesSheet visible={filesSheetVisible} onClose={() => setFilesSheetVisible(false)} />}
    </GestureHandlerRootView>
  );
}
