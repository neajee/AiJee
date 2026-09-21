import { useEffect } from "react";
import { Bell, Volume2 } from "lucide-react";
import { useAppSettingsStore } from "../store";
import { SettingsGroup, SettingsRow, SettingsSwitch } from "@/components/settings-surface";
export function NotificationsPanel() {
  const {
    pushNotifications,
    soundEffects,
    loaded,
    load,
    update
  } = useAppSettingsStore();
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);
  return <SettingsGroup header="通知">
      <SettingsRow icon={Bell} label="推送通知" right={<SettingsSwitch value={pushNotifications} onValueChange={value => update({ pushNotifications: value })} accessibilityLabel="推送通知" />} />
      <SettingsRow icon={Volume2} label="音效" isLast right={<SettingsSwitch value={soundEffects} onValueChange={value => update({ soundEffects: value })} accessibilityLabel="音效" />} />
    </SettingsGroup>;
}
