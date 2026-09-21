import { useCallback, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { usePreviewStore, type PreviewTarget } from '../store';
import { GLOBAL_PREVIEW_KEY } from '../components/preview-event-subscriber';
import { usePiClient } from '@aijee/client-sdk';

const EMPTY_TARGETS: PreviewTarget[] = [];

export function usePreviewPanelController(sessionId: string | null) {
  const client = usePiClient();
  const activeServerId = useAuthStore((state) => state.activeServerId);
  const accessToken = useAuthStore((state) =>
    activeServerId ? state.tokens[activeServerId]?.accessToken : undefined,
  );
  const targets = usePreviewStore((state) =>
    sessionId ? state.targetsBySession[sessionId] ?? EMPTY_TARGETS : EMPTY_TARGETS,
  );
  const detectedPorts = usePreviewStore((state) =>
    state.targetsBySession[GLOBAL_PREVIEW_KEY] ?? EMPTY_TARGETS,
  );
  const selectedTargetId = usePreviewStore((state) =>
    sessionId ? state.selectedTargetIdBySession[sessionId] ?? '' : '',
  );
  const selectTarget = usePreviewStore((state) => state.selectTarget);
  const upsertTarget = usePreviewStore((state) => state.upsertTarget);
  const [portInput, setPortInput] = useState('');
  const [showPortInput, setShowPortInput] = useState(false);

  const suggestions = useMemo(
    () => detectedPorts.filter((target) => !targets.some((item) => item.id === target.id)),
    [detectedPorts, targets],
  );
  const selectedTarget = useMemo(
    () => targets.find((target) => target.id === selectedTargetId) ?? targets[0] ?? null,
    [selectedTargetId, targets],
  );

  const addPort = useCallback((port: number, hostname = 'localhost') => {
    if (!sessionId) return;
    const target: PreviewTarget = { id: `${hostname}:${port}`, port, hostname, label: `${hostname}:${port}` };
    upsertTarget(sessionId, target);
    selectTarget(sessionId, target.id);
  }, [sessionId, upsertTarget, selectTarget]);

  const handleAddPort = useCallback(() => {
    const port = parseInt(portInput.trim(), 10);
    if (!port || port < 1 || port > 65535) return;
    addPort(port);
    setPortInput('');
    setShowPortInput(false);
  }, [portInput, addPort]);

  const handleAddSuggestion = useCallback(
    (target: PreviewTarget) => addPort(target.port, target.hostname),
    [addPort],
  );

  return {
    serverUrl: client.api.serverUrl,
    accessToken,
    targets,
    suggestions,
    selectedTarget,
    selectTarget,
    portInput,
    setPortInput,
    showPortInput,
    setShowPortInput,
    handleAddPort,
    handleAddSuggestion,
  };
}
