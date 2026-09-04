import { ScrollView, Spinner, Text, View } from 'tamagui';
import { useCallback, useEffect, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ServerFormFields } from './fields';
import { formStyles, SHEET_HEIGHT, sheetStyles } from './styles';
import type { ServerFormProps } from './types';

const TIMING_CONFIG = { duration: 280, easing: Easing.out(Easing.cubic) };

export function ServerFormSheet({
  visible,
  onClose,
  onSave,
  initial,
  isDark,
  loading,
  error,
}: ServerFormProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
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
    if (Platform.OS === 'web' || Platform.OS === 'android') {
      setKeyboardHeight(0);
      return;
    }
    const showSub = Keyboard.addListener('keyboardWillShow', (event) => {
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

  const panGesture = Gesture.Pan()
    .enabled(!loading)
    .onUpdate((event) => {
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(dismiss)();
      } else {
        translateY.value = withTiming(0, TIMING_CONFIG);
      }
    });
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: overlayOpacity.value > 0 ? ('auto' as const) : ('none' as const),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        if (!loading) dismiss();
      }}
    >
      <View style={sheetStyles.root}>
        <Animated.View style={[sheetStyles.overlay, { backgroundColor: colors.overlay }, overlayStyle]}>
          <Pressable style={ABSOLUTE_FILL_STYLE} onPress={loading ? undefined : dismiss} />
        </Animated.View>
        <View style={[sheetStyles.keyboardAvoider, { paddingBottom: keyboardInset }]}>
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                sheetStyles.sheet,
                {
                  backgroundColor: sheetBg,
                  paddingBottom: keyboardHeight > 0 ? 12 : sheetBottomPadding,
                  maxHeight: Math.min(SHEET_HEIGHT, maxVisibleSheetHeight),
                },
                sheetStyle,
              ]}
            >
              <View style={sheetStyles.handleBar}>
                <View style={[sheetStyles.handle, { backgroundColor: colors.sheetHandle }]} />
              </View>
              <View style={sheetStyles.sheetHeader}>
                <Text style={[sheetStyles.sheetTitle, { color: textPrimary }]}>
                  {initial ? 'Edit Server' : 'Add Server'}
                </Text>
              </View>
              <ScrollView
                contentContainerStyle={sheetStyles.sheetContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <ServerFormFields
                  name={name}
                  setName={setName}
                  address={address}
                  setAddress={setAddress}
                  isDark={isDark}
                />
                {error && (
                  <Text style={[formStyles.errorText, { color: isDark ? '#FF453A' : '#FF3B30' }]}>
                    {error}
                  </Text>
                )}
                <Pressable
                  onPress={() => {
                    if (canSave) onSave({ name: name.trim(), address: address.trim() });
                  }}
                  style={[
                    sheetStyles.sheetSaveBtn,
                    { backgroundColor: isDark ? '#fefdfd' : '#1a1a1a' },
                    !canSave && { opacity: 0.4 },
                  ]}
                  disabled={!canSave}
                >
                  {loading ? (
                    <Spinner size="small" color={isDark ? '#1a1a1a' : '#fff'} />
                  ) : (
                    <Text
                      style={[
                        sheetStyles.sheetSaveBtnText,
                        { color: isDark ? '#1a1a1a' : '#fff' },
                      ]}
                    >
                      {initial ? 'Save & Connect' : 'Add & Connect'}
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </Modal>
  );
}
