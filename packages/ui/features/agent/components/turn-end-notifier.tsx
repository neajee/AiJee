import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { usePathname } from "expo-router";
import { usePiClient, useTurnEnd, type TurnEndEvent } from "@aijee/client-sdk";

import { useWorkspaceStore } from "@/features/workspace/store";
import { useAppSettingsStore } from "@/features/settings/store";
import { browserWindowHasAttention } from "../browser-notifications";

/** A settled turn can be reported more than once; ignore the echoes. */
const REPEAT_WINDOW_MS = 3000;

/**
 * Turns "the agent finished" into something the user can notice from elsewhere:
 * a badge on the session and its project in the sidebar, plus an OS
 * notification when the window isn't the one being looked at.
 *
 * Mounted once next to the other global stream subscribers, because a session
 * finishing matters most when its screen is *not* open.
 */
export function TurnEndNotifier() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const lastNotifiedRef = useRef<Record<string, number>>({});

  const markSessionNotification = useWorkspaceStore(
    (s) => s.markSessionNotification,
  );
  const markWorkspaceNotification = useWorkspaceStore(
    (s) => s.markWorkspaceNotification,
  );
  const registerSessionWorkspace = useWorkspaceStore(
    (s) => s.registerSessionWorkspace,
  );
  const pushNotifications = useAppSettingsStore((s) => s.pushNotifications);
  const soundEffects = useAppSettingsStore((s) => s.soundEffects);
  const loadSettings = useAppSettingsStore((s) => s.load);
  const settingsLoaded = useAppSettingsStore((s) => s.loaded);

  useEffect(() => {
    if (!settingsLoaded) loadSettings();
  }, [settingsLoaded, loadSettings]);

  /*
   * Learn which project each streaming session belongs to.
   *
   * The sidebar needs this to show activity on a folded project, and the server
   * only tags `message_start` with a workspace id (the rest are stripped to keep
   * delta events small), so that is the event worth listening for.
   */
  const client = usePiClient();
  const mappedRef = useRef<Set<string>>(new Set());
  const registerRef = useRef(registerSessionWorkspace);
  registerRef.current = registerSessionWorkspace;
  useEffect(() => {
    const sub = client.events$.subscribe((envelope) => {
      const sessionId = envelope.session_id;
      const workspaceId = envelope.workspace_id;
      if (!sessionId || !workspaceId || mappedRef.current.has(sessionId)) return;
      mappedRef.current.add(sessionId);
      registerRef.current(sessionId, workspaceId);
    });
    return () => sub.unsubscribe();
  }, [client]);

  const handleTurnEnd = useCallback(
    ({ sessionId, workspaceId }: TurnEndEvent) => {
      const now = Date.now();
      const last = lastNotifiedRef.current[sessionId] ?? 0;
      if (now - last < REPEAT_WINDOW_MS) return;
      lastNotifiedRef.current[sessionId] = now;

      if (workspaceId) registerSessionWorkspace(sessionId, workspaceId);

      // Watching the session finish is its own notification.
      const isOnScreen =
        pathnameRef.current.includes(`/s/${sessionId}`) &&
        browserWindowHasAttention();
      if (isOnScreen) return;

      markSessionNotification(sessionId);
      const targetWorkspace =
        workspaceId ?? useWorkspaceStore.getState().getWorkspaceForSession(sessionId);
      if (targetWorkspace) markWorkspaceNotification(targetWorkspace);

      if (pushNotifications) {
        const name = workspaceName(targetWorkspace);
        notify("对话已完成", name ? `${name} · 智能体已停止` : "智能体已停止", sessionId);
      }
      if (soundEffects) chime();
    },
    [
      registerSessionWorkspace,
      markSessionNotification,
      markWorkspaceNotification,
      pushNotifications,
      soundEffects,
    ],
  );

  useTurnEnd(handleTurnEnd);

  return null;
}

function workspaceName(workspaceId: string | null): string | null {
  if (!workspaceId) return null;
  const { workspaces } = useWorkspaceStore.getState();
  return workspaces.find((w) => w.id === workspaceId)?.title ?? null;
}

/**
 * Web only: native push needs expo-notifications plus a project id, which this
 * build doesn't configure, so mobile falls back to the in-app badges.
 */
function notify(title: string, body: string, tag: string) {
  if (Platform.OS !== "web") return;
  const NotificationApi = (globalThis as any).Notification as
    | (new (title: string, options?: unknown) => { onclick: unknown })
    | undefined;
  if (!NotificationApi || (NotificationApi as any).permission !== "granted") {
    return;
  }
  try {
    // `tag` collapses repeats for the same session instead of stacking them.
    const notification = new NotificationApi(title, { body, tag });
    notification.onclick = () => {
      try {
        (globalThis as any).focus?.();
      } catch {}
    };
  } catch {
    // Notification constructors throw on some platforms (e.g. Android Chrome
    // wants a service worker). A missing toast is not worth surfacing.
  }
}

/** A short two-note blip, so no audio asset has to ship with the app. */
function chime() {
  if (Platform.OS !== "web") return;
  const AudioCtor =
    (globalThis as any).AudioContext ?? (globalThis as any).webkitAudioContext;
  if (!AudioCtor) return;
  try {
    const ctx = new AudioCtor();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.14);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.34);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {}
}
