import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'tamagui';

import { MobileHeaderBar } from '../../components/mobile-header-bar';
import { WorkspaceSheet } from '../../components/workspace-sheet';
import { MobileChangesSheet } from '../../components/mobile-changes-sheet';
import { MobileFilesSheet } from '../../components/mobile-files-sheet';
import { MobilePreviewSheet } from '../../components/mobile-preview-sheet';
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
          <MobileHeaderBar
            onWorkspacePress={() => setSheetVisible(true)}
            onFilesPress={openFiles}
            onGitPress={openGit}
            onPreviewPress={openPreview}
            onTasksPress={() => setTasksSheetVisible(true)}
            onTaskOutputPress={() => setTaskOutputSheetVisible(true)}
          />
        )}
        <View style={styles.mobileContent}>{children}</View>
        {hasServer && <ConnectionStatusBanner />}
      </SafeAreaView>
      {hasServer && isCodeMode && (
        <>
          <WorkspaceSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
          {hasWorkspaces && (
            <>
              <MobileChangesSheet visible={changesSheetVisible} onClose={() => setChangesSheetVisible(false)} />
              <MobilePreviewSheet
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
      {hasServer && <MobileFilesSheet visible={filesSheetVisible} onClose={() => setFilesSheetVisible(false)} />}
    </GestureHandlerRootView>
  );
}
