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
  contentStyle?: React.CSSProperties | React.CSSProperties[];
  closeOnBackdrop?: boolean;
}) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const contentStyles = Array.isArray(contentStyle) ? contentStyle : contentStyle ? [contentStyle] : [];
  if (!visible) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={closeOnBackdrop ? onClose : undefined}>
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-auto rounded-lg border border-border bg-card p-4 shadow-xl" style={Object.assign({}, ...contentStyles)} onClick={event => event.stopPropagation()}>
        {children}
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
