import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MoreHorizontal, Pencil, QrCode, X, Trash2 } from "lucide-react-native";
import { Fonts } from "@/constants/theme";
import { PiLogo } from "@/components/pi-logo";
import { useSettingsPalette } from "@/components/settings-surface";
import { useIsSessionStreaming } from "@aijee/client-sdk";
import type { Server } from "@/features/servers/store";
import { styles } from "./styles";
function ConnectionStatusDot({ label, color, connecting }: { label: string; color: string; connecting: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!connecting) { opacity.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [connecting, opacity]);
  return <Animated.View accessibilityLabel={label} style={[styles.statusDot, { backgroundColor: color, opacity }]} />;
}

export function ServerRow({
  server,
  isActive,
  isConnecting,
  isFailed,
  lastConnectedAt,
  isLast,
  onPress,
  onShowCode,
  onToggleMenu,
}: {
  server: Server;
  isActive: boolean;
  isConnecting: boolean;
  isFailed: boolean;
  lastConnectedAt?: number;
  isLast: boolean;
  onPress: () => void;
  onShowCode: () => void;
  onToggleMenu: (measure: (callback: (x: number, y: number, width: number, height: number) => void) => void) => void;
}) {
  const p = useSettingsPalette();
  const [hovered, setHovered] = useState(false);
  const moreRef = useRef<any>(null);
  const address = server.address.replace(/^https?:\/\//, '');
  const minutes = lastConnectedAt ? Math.max(1, Math.floor((Date.now() - lastConnectedAt) / 60_000)) : null;
  const status = isConnecting
    ? { label: '连接中…', color: p.notification }
    : isFailed
      ? { label: '连接失败 · 点击重试', color: p.destructive }
      : isActive
        ? { label: `${address} · 已连接`, color: p.success }
        : { label: minutes ? `上次连接 ${minutes} 分钟前` : '离线 · 尚无连接记录', color: p.textTertiary };

  return (
    <View style={styles.serverRowWrap}>
      {isActive ? <View style={[styles.activeRail, { backgroundColor: p.success }]} /> : null}
      <Pressable
        onPress={onPress}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        accessibilityRole="button"
        accessibilityLabel={`连接到 ${server.name}，${status.label}`}
        style={({ pressed, hovered: rowHovered, focused }: any) => [styles.serverRow, isActive && { backgroundColor: p.pressed }, (pressed || rowHovered) && { backgroundColor: p.pressed }, focused && { outlineWidth: 2, outlineColor: p.accent, outlineOffset: 2 } as any]}
      >
      <ConnectionStatusDot label={status.label} color={status.color} connecting={isConnecting} />
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: p.tile,
        }}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color={p.text} />
        ) : (
          <PiLogo size={16} color={p.textSecondary} />
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 13, fontFamily: Fonts.sansMedium, color: p.text }} numberOfLines={1}>{server.name}</Text>
        <View style={styles.statusLine}>
          <Text style={{ fontSize: 12, fontFamily: Fonts.mono, color: p.textTertiary, opacity: 0.55 }} numberOfLines={1}>{status.label}</Text>
        </View>
      </View>
      </Pressable>

      <Pressable
        onPress={onShowCode}
        accessibilityRole="button"
        accessibilityLabel={`显示 ${server.name} 授权二维码`}
        hitSlop={8}
        style={({ pressed, hovered: qrHovered, focused }: any) => [styles.qrAction, (pressed || qrHovered) && { backgroundColor: p.pressed }, focused && { outlineWidth: 2, outlineColor: p.accent, outlineOffset: 2 } as any]}
      >
        <QrCode size={20} color={p.textSecondary} strokeWidth={1.5} />
      </Pressable>
      <Pressable
        ref={moreRef}
        onPress={() => onToggleMenu((callback) => moreRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => callback(x, y, width, height)))}
        accessibilityRole="button"
        accessibilityLabel={`管理 ${server.name}`}
        hitSlop={8}
        style={({ pressed, hovered: moreHovered, focused }: any) => [styles.moreAction, (hovered || pressed || moreHovered || focused || Platform.OS !== 'web') && { opacity: 1 }, (pressed || moreHovered || focused) && { backgroundColor: p.pressed }, focused && { outlineWidth: 2, outlineColor: p.accent, outlineOffset: 2 } as any]}
      >
        <MoreHorizontal size={20} color={p.textSecondary} strokeWidth={1.8} />
      </Pressable>
      {!isLast ? <View style={[styles.rowDivider, { backgroundColor: p.separator }]} /> : null}
    </View>
  );
}

export function FooterAction({ icon: Icon, label, onPress, isLast = false, isFirst = false }: { icon: any; label: string; onPress: () => void; isLast?: boolean; isFirst?: boolean }) {
  const p = useSettingsPalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed, hovered }: any) => [
        styles.footerAction,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator },
        (pressed || hovered) && { backgroundColor: p.pressed },
        isFirst && { position: 'relative' },
      ]}
    >
      {isFirst ? <View style={[styles.footerDivider, { backgroundColor: p.separator }]} /> : null}
      <Icon size={16} color={p.textSecondary} strokeWidth={1.8} />
      <Text style={[styles.footerActionText, { color: p.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function MenuAction({ icon: Icon, label, onPress, color }: { icon: any; label: string; onPress: () => void; color: string }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.menuAction, pressed && { opacity: 0.6 }]}><Icon size={16} color={color} strokeWidth={1.8} /><Text style={[styles.menuActionText, { color }]}>{label}</Text></Pressable>;
}
