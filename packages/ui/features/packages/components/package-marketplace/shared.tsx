import { Spinner, Text, View } from 'tamagui';
import { Pressable } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import { useSettingsMetrics, useSettingsPalette } from '@/components/settings-surface';
import { styles } from '../../utils/marketplace-styles';

export function Notice({ text, tone }: { text: string; tone: 'warning' | 'error' }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const color = tone === 'error' ? p.destructive : p.isDark ? '#D29922' : '#9A6700';
  const background =
    tone === 'error'
      ? p.isDark
        ? 'rgba(248,81,73,0.14)'
        : 'rgba(207,34,46,0.10)'
      : p.isDark
        ? 'rgba(210,153,34,0.14)'
        : 'rgba(154,103,0,0.10)';

  return (
    <View style={[styles.notice, { backgroundColor: background, borderRadius: m.tileRadius }]}>
      <ShieldAlert size={13} color={color} strokeWidth={2} />
      <Text style={{ flex: 1, fontSize: m.descSize, color, lineHeight: m.descSize * 1.45 }}>
        {text}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  icon: Icon,
  busy,
  onPress,
}: {
  label: string;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  busy?: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: p.accent, borderColor: p.accent, borderRadius: m.tileRadius },
        (pressed || busy) && { opacity: 0.6 },
      ]}
    >
      {busy ? (
        <Spinner size="small" color={p.onAccent} />
      ) : (
        <>
          {Icon ? <Icon size={13} color={p.onAccent} strokeWidth={2.2} /> : null}
          <Text style={{ fontSize: m.descSize, fontFamily: Fonts.sansMedium, color: p.onAccent }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed, hovered }: any) => [
        styles.button,
        { borderColor: p.separator, borderRadius: m.tileRadius },
        hovered && { backgroundColor: p.pressed },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={{ fontSize: m.descSize, fontFamily: Fonts.sansMedium, color: p.text }}>
        {label}
      </Text>
    </Pressable>
  );
}
