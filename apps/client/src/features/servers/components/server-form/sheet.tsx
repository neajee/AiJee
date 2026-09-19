import { toTailwind } from "@/styles/to-tailwind";
import { useCallback, useEffect, useState } from 'react';
import { Keyboard, useWindowDimensions } from "@/platform/browser";
import { useSafeAreaInsets } from "@/platform/browser";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "@/platform/animation";
import { Gesture } from "@/platform/animation";
import { Colors } from '@/constants/theme';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ServerFormFields } from './fields';
import { formStyles, SHEET_HEIGHT, sheetStyles } from './style-tokens';
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
  return <div visible={visible} transparent animationType="none" onRequestClose={() => {
    if (!loading) dismiss();
  }}>
      <div className={toTailwind(sheetStyles.root)}>
        <div className={toTailwind([sheetStyles.overlay, {
        backgroundColor: colors.overlay
      }, overlayStyle])}>
          <button className={toTailwind(ABSOLUTE_FILL_STYLE)} onClick={loading ? undefined : dismiss} />
        </div>
        <div className={toTailwind([sheetStyles.keyboardAvoider, {
        paddingBottom: keyboardInset
      }])}>
          <div>
            <div className={toTailwind([sheetStyles.sheet, {
            backgroundColor: sheetBg,
            paddingBottom: keyboardHeight > 0 ? 12 : sheetBottomPadding,
            maxHeight: Math.min(SHEET_HEIGHT, maxVisibleSheetHeight)
          }, sheetStyle])}>
              <div className={toTailwind(sheetStyles.handleBar)}>
                <div className={toTailwind([sheetStyles.handle, {
                backgroundColor: colors.sheetHandle
              }])} />
              </div>
              <div className={toTailwind(sheetStyles.sheetHeader)}>
                <span className={toTailwind([sheetStyles.sheetTitle, {
                color: textPrimary
              }])}>
                  {initial ? 'Edit Server' : 'Add Server'}
                </span>
              </div>
              <div keyboardShouldPersistTaps="handled">
                <ServerFormFields name={name} setName={setName} address={address} setAddress={setAddress} isDark={isDark} />
                {error && <span className={toTailwind([formStyles.errorText, {
                color: isDark ? '#FF453A' : '#FF3B30'
              }])}>
                    {error}
                  </span>}
                <button onClick={() => {
                if (canSave) onSave({
                  name: name.trim(),
                  address: address.trim()
                });
              }} className={toTailwind([sheetStyles.sheetSaveBtn, {
                backgroundColor: isDark ? '#fefdfd' : '#1a1a1a'
              }, !canSave && {
                opacity: 0.4
              }])} disabled={!canSave}>
                  {loading ? <span size="small" color={isDark ? '#1a1a1a' : '#fff'} /> : <span className={toTailwind([sheetStyles.sheetSaveBtnText, {
                  color: isDark ? '#1a1a1a' : '#fff'
                }])}>
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
