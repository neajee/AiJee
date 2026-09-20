import type React from "react";
import type { ReactNode } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
export function AppModal({
  visible,
  onClose,
  children,
  contentStyle,
  closeOnBackdrop = true
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  contentStyle?: React.CSSProperties<React.CSSProperties>;
  closeOnBackdrop?: boolean;
}) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const contentStyles = Array.isArray(contentStyle) ? contentStyle : contentStyle ? [contentStyle] : [];
  return <div visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <div className={"block"}>
        <button onClick={closeOnBackdrop ? onClose : undefined} aria-label="关闭弹窗" />
        <button onClick={event => event.stopPropagation()}>
          {children}
        </button>
      </div>
    </div>;
}
const rootStyle = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center'
} as const;
const backdropStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
} as const;
const contentStyleBase = {
  maxWidth: '100%',
  overflow: 'hidden',
  borderWidth: 0.5,
  borderRadius: 18,
  borderColor: 'rgba(255,255,255,0.16)',
  boxShadow: '0px 14px 38px rgba(0,0,0,0.24)',
  ...({
    backdropFilter: 'blur(18px)'
  } as any)
} as const;
