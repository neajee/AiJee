import { toTailwind } from "@/styles/to-tailwind";
import { useEffect, useRef, useState } from "react";
import { Animated } from "@/platform/animation";
import { MoreHorizontal, Pencil, QrCode, X, Trash2 } from "lucide-react";
import { Fonts } from "@/constants/theme";
import { PiLogo } from "@/components/pi-logo";
import { useSettingsPalette } from "@/components/settings-surface";
import { useIsSessionStreaming } from "@aijee/client-sdk";
import type { Server } from "@/features/servers/store";
import { styles } from "./style-tokens";
function ConnectionStatusDot({
  label,
  color,
  connecting
}: {
  label: string;
  color: string;
  connecting: boolean;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!connecting) {
      opacity.setValue(1);
      return;
    }
    const animation = Animated.loop(Animated.sequence([Animated.timing(opacity, {
      toValue: 0.35,
      duration: 700,
      useNativeDriver: true
    }), Animated.timing(opacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true
    })]));
    animation.start();
    return () => animation.stop();
  }, [connecting, opacity]);
  return <div aria-label={label} className={toTailwind([styles.statusDot, {
    backgroundColor: color,
    opacity
  }])} />;
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
  onToggleMenu
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
  const status = isConnecting ? {
    label: '连接中…',
    color: p.notification
  } : isFailed ? {
    label: '连接失败 · 点击重试',
    color: p.destructive
  } : isActive ? {
    label: `${address} · 已连接`,
    color: p.success
  } : {
    label: minutes ? `上次连接 ${minutes} 分钟前` : '离线 · 尚无连接记录',
    color: p.textTertiary
  };
  return <div className={toTailwind(styles.serverRowWrap)}>
      {isActive ? <div className={toTailwind([styles.activeRail, {
      backgroundColor: p.success
    }])} /> : null}
      <button onClick={onPress} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} role="button" aria-label={`连接到 ${server.name}，${status.label}`}>
      <ConnectionStatusDot label={status.label} color={status.color} connecting={isConnecting} />
      <div className={toTailwind({
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: p.tile
      })}>
        {isConnecting ? <span size="small" color={p.text} /> : <PiLogo size={16} color={p.textSecondary} />}
      </div>

      <div className={toTailwind({
        flex: 1,
        alignSelf: "stretch",
        justifyContent: "center",
        gap: 2
      })}>
        <span className={toTailwind({
          fontSize: 13,
          fontFamily: Fonts.sansMedium,
          color: p.text,
          textAlign: "left"
        })}>{server.name}</span>
        <div className={toTailwind(styles.statusLine)}>
          <span className={toTailwind({
            fontSize: 12,
            fontFamily: Fonts.mono,
            color: p.textTertiary,
            opacity: 0.55,
            textAlign: "left"
          })}>{status.label}</span>
        </div>
      </div>
      </button>

      <button onClick={onShowCode} role="button" aria-label={`显示 ${server.name} 授权二维码`} hitSlop={8}>
        <QrCode size={20} color={p.textSecondary} strokeWidth={1.5} />
      </button>
      <button ref={moreRef} onClick={() => onToggleMenu(callback => moreRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => callback(x, y, width, height)))} role="button" aria-label={`管理 ${server.name}`} hitSlop={8}>
        <MoreHorizontal size={20} color={p.textSecondary} strokeWidth={1.8} />
      </button>
      {!isLast ? <div className={toTailwind([styles.rowDivider, {
      backgroundColor: p.separator
    }])} /> : null}
    </div>;
}
export function FooterAction({
  icon: Icon,
  label,
  onPress,
  isLast = false,
  isFirst = false
}: {
  icon: any;
  label: string;
  onPress: () => void;
  isLast?: boolean;
  isFirst?: boolean;
}) {
  const p = useSettingsPalette();
  return <button onClick={onPress} role="button" aria-label={label}>
      {isFirst ? <div className={toTailwind([styles.footerDivider, {
      backgroundColor: p.separator
    }])} /> : null}
      <Icon size={16} color={p.textSecondary} strokeWidth={1.8} />
      <span className={toTailwind([styles.footerActionText, {
      color: p.textSecondary
    }])}>{label}</span>
    </button>;
}
export function MenuAction({
  icon: Icon,
  label,
  onPress,
  color
}: {
  icon: any;
  label: string;
  onPress: () => void;
  color: string;
}) {
  return <button onClick={onPress} role="button" aria-label={label}><Icon size={16} color={color} strokeWidth={1.8} /><span className={toTailwind([styles.menuActionText, {
      color
    }])}>{label}</span></button>;
}
