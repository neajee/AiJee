import { Spinner, Text, View } from 'tamagui';
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { Platform, Pressable } from 'react-native';
import { AlertCircle, CheckCircle2 } from "lucide-react-native";
import { sdk, unwrapApiData, type PackageStatus } from "@aijee/client-sdk";
import { useSettingsMetrics, useSettingsPalette } from "@/components/settings-surface";
import { pkgStyles } from "../utils/package-styles";

const { status2: getPackageStatus, update: updatePackage, install: installPackage } = sdk;
export const PLATFORM_LABEL =
  Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web';

/** Agent package status plus the install/update action. */
export function useAgentPackage() {
  const [pkg, setPkg] = useState<PackageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPackageStatus();
      const data = unwrapApiData(result.data) as PackageStatus | undefined;
      setPkg(data ?? null);
    } catch {
      setError('无法获取包状态');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const apply = useCallback(async () => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      if (pkg && !pkg.installed) {
        await installPackage();
        setSuccess('Pi agent 安装成功');
      } else {
        await updatePackage();
        setSuccess('Pi agent 更新成功');
      }
      await fetchStatus();
    } catch {
      setError('更新失败，请查看服务器日志。');
    } finally {
      setUpdating(false);
    }
  }, [pkg, fetchStatus]);

  const needsInstall = !!pkg && !pkg.installed;
  const hasUpdate = !!(
    pkg?.installed &&
    pkg.latest_version &&
    pkg.installed_version &&
    pkg.latest_version !== pkg.installed_version
  );

  return {
    pkg,
    loading,
    updating,
    error,
    success,
    needsInstall,
    hasUpdate,
    /** True when there is something actionable to offer. */
    actionable: needsInstall || hasUpdate,
    apply,
  };
}

/** Filled pill that installs or updates the agent. */
export function AgentActionButton({
  label,
  icon: Icon,
  updating,
  onPress,
}: {
  label: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  updating: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      disabled={updating}
      accessibilityRole="button"
      accessibilityLabel={`${label} Pi agent`}
      style={({ pressed }) => [
        pkgStyles.actionBtn,
        { backgroundColor: p.accent, minHeight: m.rowMinHeight - 16 },
        pressed && { opacity: 0.6 },
        updating && { opacity: 0.5 },
      ]}
    >
      {updating ? (
        <Spinner size="small" color={p.onAccent} />
      ) : (
        <>
          <Icon size={13} color={p.onAccent} strokeWidth={2.2} />
          <Text style={[pkgStyles.actionBtnText, { color: p.onAccent }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function AgentBanner({ text, ok }: { text: string; ok: boolean }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  // Tinted from the palette rather than fixed iOS colours, so the banner keeps
  // its contrast in both themes.
  const tint = ok
    ? p.isDark
      ? 'rgba(63,185,80,0.14)'
      : 'rgba(26,127,55,0.10)'
    : p.isDark
      ? 'rgba(248,81,73,0.14)'
      : 'rgba(207,34,46,0.10)';

  return (
    <View
      style={[
        pkgStyles.messageBanner,
        { marginLeft: m.gutter, marginRight: m.gutter, backgroundColor: tint },
      ]}
    >
      {ok ? (
        <CheckCircle2 size={13} color={p.success} strokeWidth={2} />
      ) : (
        <AlertCircle size={13} color={p.destructive} strokeWidth={2} />
      )}
      <Text
        style={[
          pkgStyles.messageText,
          { fontSize: m.descSize, color: ok ? p.success : p.destructive },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}
