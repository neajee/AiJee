import { useEffect } from "react";
import { Bell, Volume2 } from "lucide-react-native";
import { useAppSettingsStore } from "../store";
import { SettingsGroup, SettingsRow, SettingsSwitch } from "@/components/settings-surface";
export function NotificationsPanel() {
  const { pushNotifications, soundEffects, loaded, load, update } = useAppSettingsStore();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <SettingsGroup header="通知">
      <SettingsRow
        icon={Bell}
        label="推送通知"
        description="接收会话更新提醒"
        right={
          <SettingsSwitch
            value={pushNotifications}
            onValueChange={(v) => update({ pushNotifications: v })}
            accessibilityLabel="推送通知"
          />
        }
      />
      <SettingsRow
        icon={Volume2}
        label="音效"
        description="为操作与提醒播放声音"
        isLast
        right={
          <SettingsSwitch
            value={soundEffects}
            onValueChange={(v) => update({ soundEffects: v })}
            accessibilityLabel="音效"
          />
        }
      />
    </SettingsGroup>
  );
}
