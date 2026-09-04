import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import QRCode from "qrcode";
import { useOptionalPiClient } from "@aijee/client-sdk";
import { useServersStore, type Server } from "@/features/servers/store";
import { useAuthStore } from "@/features/auth/store";
import { useWorkspaceStore } from "@/features/workspace/store";
import type { ServerFormData } from "../components/server-form";

export function useServersController() {
  const router = useRouter();
  const client = useOptionalPiClient();

  const { servers, loaded, load, addServer, updateServer, removeServer } =
    useServersStore();
  const logoutFromServer = useAuthStore((s) => s.logoutFromServer);
  const activeServerId = useAuthStore((s) => s.activeServerId);

  const [formVisible, setFormVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | undefined>();
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [failedServerId, setFailedServerId] = useState<string | null>(null);
  const [lastConnected, setLastConnected] = useState<Record<string, number>>({});
  const [menuServerId, setMenuServerId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [refreshingCode, setRefreshingCode] = useState(false);
  const [codeDialog, setCodeDialog] = useState<{ code: string; url: string; image: string } | null>(null);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const handleAdd = useCallback(() => {
    setEditingServer(undefined);
    setLoginError(null);
    setFormVisible(true);
  }, []);

  const handleEdit = useCallback((server: Server) => {
    setEditingServer(server);
    setLoginError(null);
    setFormVisible(true);
  }, []);

  const handleDelete = useCallback(
    (server: Server) => {
      const doDelete = () => {
        removeServer(server.id);
        logoutFromServer(server.id);
      };
      if (Platform.OS === "web") {
        if (window.confirm(`移除「${server.name}」？`)) doDelete();
      } else {
        Alert.alert("移除服务器", `移除「${server.name}」？`, [
          { text: "取消", style: "cancel" },
          { text: "移除", style: "destructive", onPress: doDelete },
        ]);
      }
    },
    [removeServer, logoutFromServer],
  );

  const handleShowCode = useCallback(async () => {
    if (!client) {
      setLoginError("当前页面尚未连接设备，无法生成授权码。");
      return;
    }
    try {
      const result = await client.api.getDeviceCode();
      const image = await QRCode.toDataURL(result.url, { width: 240, margin: 1 });
      setCodeDialog({ code: result.code, url: result.url, image });
    } catch (error) {
      Alert.alert("获取授权码失败", error instanceof Error ? error.message : "请稍后重试");
    }
  }, [client]);

  const handleRefreshCode = useCallback(async () => {
    if (!client || refreshingCode || !activeServerId) return;
    const server = servers.find((entry) => entry.id === activeServerId);
    if (!server) return;
    setRefreshingCode(true);
    try {
      const result = await client.api.createDeviceCode();
      const authorized = await useAuthStore.getState().authorizeWithCode(
        server.address,
        result.code,
        server.id,
        server.name,
      );
      if (!authorized.success) throw new Error(authorized.error ?? "更新设备令牌失败");
      const image = await QRCode.toDataURL(result.url, { width: 240, margin: 1 });
      setCodeDialog({ code: result.code, url: result.url, image });
    } catch (error) {
      Alert.alert("刷新授权码失败", error instanceof Error ? error.message : "请稍后重试");
    } finally {
      setRefreshingCode(false);
    }
  }, [activeServerId, client, refreshingCode, servers]);

  const navigateAfterConnect = useCallback(async () => {
    const ws = useWorkspaceStore.getState();
    const serverId = useAuthStore.getState().activeServerId;
    await ws.switchServer(serverId);
    await ws.fetchWorkspaces(serverId);
    router.replace("/");
  }, [router]);

  const handleConnect = useCallback(
    async (server: Server) => {
      try {
        const auth = useAuthStore.getState();
        setConnecting(server.id);

        if (server.id === activeServerId) {
          setLastConnected((current) => ({ ...current, [server.id]: Date.now() }));
          await navigateAfterConnect();
          return;
        }

        const connected = auth.hasToken(server.id)
          ? await auth.activateServer(server)
          : false;

        if (connected) {
          setFailedServerId(null);
          setLastConnected((current) => ({ ...current, [server.id]: Date.now() }));
          await navigateAfterConnect();
        } else {
          // A stored token that no longer works is indistinguishable from none:
          // ask for credentials rather than failing silently.
          setEditingServer(server);
          setLoginError("设备授权已失效，请重新扫描授权码。");
          setFormVisible(true);
        }
      } catch (e) {
        console.error("handleConnect error:", e);
        setFailedServerId(server.id);
        setLoginError("连接失败，请检查地址与网络。");
      } finally {
        setConnecting(null);
      }
    },
    [activeServerId, navigateAfterConnect],
  );

  const handleSave = useCallback(
    async (data: ServerFormData) => {
      setLoginLoading(true);
      setLoginError(null);

      const serverData = data;
      let server: Server;
      if (editingServer) {
        await updateServer(editingServer.id, serverData);
        server = { ...editingServer, ...serverData };
      } else {
        await addServer(serverData);
        const current = useServersStore.getState().servers;
        server = current[current.length - 1];
      }

      setLoginLoading(false);
      setFormVisible(false);
      setLoginError("请扫描设备端生成的一次性授权码完成连接。");
    },
    [editingServer, addServer, updateServer],
  );


  return {
    router, client, servers, activeServerId, formVisible, editingServer, loginLoading, loginError, qrVisible, connecting, failedServerId,
    lastConnected, menuServerId, menuPosition, refreshingCode, codeDialog, setFormVisible, setEditingServer, setLoginError, setQrVisible,
    setConnecting, setFailedServerId, setLastConnected, setMenuServerId, setMenuPosition, setRefreshingCode, setCodeDialog, logoutFromServer,
    handleAdd, handleEdit, handleDelete, handleShowCode, handleRefreshCode, handleConnect, handleSave,
  };
}

export type ServersController = ReturnType<typeof useServersController>;
