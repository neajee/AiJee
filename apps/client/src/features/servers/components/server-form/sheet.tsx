import { useCallback, useEffect, useState } from 'react';
import { Keyboard, useWindowDimensions } from "@/platform/browser";
import { useSafeAreaInsets } from "@/platform/browser";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "@/styles/motion";
import { Gesture } from "@/styles/motion";
import { Colors } from '@/constants/theme';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ServerFormFields } from './fields';
const SHEET_HEIGHT = 520;
import type { ServerFormProps } from './component-types';
const TIMING_CONFIG = {
  duration: 280,
  easing: Easing.out(Easing.cubic)
};
export function ServerFormSheet({
  visible,
  onClose,
  onSave,
  initial,
  isDark,
  loading,
  error
}: ServerFormProps) {
  const insets = useSafeAreaInsets();
  const {
    height: windowHeight
  } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const translateY = useSharedValue(SHEET_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const sheetBg = isDark ? '#1e1e1e' : '#FFFFFF';
  const sheetBottomPadding = Math.max(insets.bottom, 12);
  const keyboardInset = Math.max(0, keyboardHeight - insets.bottom);
  const maxVisibleSheetHeight = Math.max(280, windowHeight - keyboardInset - insets.top - 12);
  const canSave = Boolean(name.trim() && address.trim() && !loading);
  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setAddress(initial?.address ?? '');
      translateY.value = withTiming(0, TIMING_CONFIG);
      overlayOpacity.value = withTiming(1, TIMING_CONFIG);
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, TIMING_CONFIG);
      overlayOpacity.value = withTiming(0, TIMING_CONFIG);
      setKeyboardHeight(0);
    }
  }, [initial, overlayOpacity, translateY, visible]);
  useEffect(() => {
    if (true || false) {
      setKeyboardHeight(0);
      return;
    }
    const showSub = Keyboard.addListener('keyboardWillShow', event => {
      if (visible) setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);
  const dismiss = useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, TIMING_CONFIG);
    overlayOpacity.value = withTiming(0, TIMING_CONFIG, () => runOnJS(onClose)());
  }, [onClose, overlayOpacity, translateY]);
  const panGesture = Gesture.Pan().enabled(!loading).onUpdate(event => {
    if (event.translationY > 0) translateY.value = event.translationY;
  }).onEnd(event => {
    if (event.translationY > 100 || event.velocityY > 500) {
      runOnJS(dismiss)();
    } else {
      translateY.value = withTiming(0, TIMING_CONFIG);
    }
  });
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: translateY.value
    }]
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: overlayOpacity.value > 0 ? 'auto' as const : 'none' as const
  }));
  return <div hidden={!visible}>
      <div className="flex flex-col">
        <div className={"  bg-black/50"}>
          <button className="inline-flex items-center" onClick={loading ? undefined : dismiss} />
        </div>
        <div className={"  pb-0"}>
          <div>
            <div className={"  pb-0 max-h-0"}>
              <div className="flex flex-col">
                <div className={"  bg-muted"} />
              </div>
              <div className="flex flex-col">
                <span>
                  {initial ? 'Edit Server' : 'Add Server'}
                </span>
              </div>
              <div>
                <ServerFormFields name={name} setName={setName} address={address} setAddress={setAddress} isDark={isDark} />
                {error && <span>
                    {error}
                  </span>}
                <button onClick={() => {
                if (canSave) onSave({
                  name: name.trim(),
                  address: address.trim()
                });
              }} className={"  opacity-[0.4]"} disabled={!canSave}>
                  {loading ? <span className="size-3 animate-spin" /> : <span>
                      {initial ? 'Save & Connect' : 'Add & Connect'}
                    </span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}
