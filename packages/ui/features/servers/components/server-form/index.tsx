import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Eye, EyeOff, X } from "lucide-react-native";

import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/features/navigation/hooks/use-responsive-layout";
import type { Server } from "@/features/servers/store";

/**
 * The add/edit-server form.
 *
 * Shared by the onboarding screen and the connection settings section so both
 * collect credentials the same way: a centred modal where there is room, a
 * bottom sheet where there is not.
 */
const SHEET_HEIGHT = 520;
const TIMING_CONFIG = { duration: 280, easing: Easing.out(Easing.cubic) };

function ServerFormFields({
  name,
  setName,
  address,
  setAddress,
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isDark,
  autoFocus,
}: {
  name: string;
  setName: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  isDark: boolean;
  autoFocus?: boolean;
}) {
  const textMuted = isDark ? "#cdc8c5" : "#888";
  const textPrimary = isDark ? "#fefdfd" : "#1a1a1a";
  const inputBg = isDark ? "#2a2a2a" : "#F6F6F6";
  const borderColor = isDark ? "#3b3a39" : "rgba(0,0,0,0.08)";

  return (
    <View style={formStyles.fields}>
      <View style={formStyles.field}>
        <Text style={[formStyles.label, { color: textMuted }]}>Name</Text>
        <TextInput
          style={[
            formStyles.input,
            { backgroundColor: inputBg, color: textPrimary, borderColor },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="My Server"
          placeholderTextColor={isDark ? "#666" : "#bbb"}
          autoFocus={autoFocus}
        />
      </View>
      <View style={formStyles.field}>
        <Text style={[formStyles.label, { color: textMuted }]}>Address</Text>
        <TextInput
          style={[
            formStyles.input,
            { backgroundColor: inputBg, color: textPrimary, borderColor },
          ]}
          value={address}
          onChangeText={setAddress}
          placeholder="http://192.168.1.100:5454"
          placeholderTextColor={isDark ? "#666" : "#bbb"}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>
      <View style={formStyles.field}>
        <Text style={[formStyles.label, { color: textMuted }]}>Username</Text>
        <TextInput
          style={[
            formStyles.input,
            { backgroundColor: inputBg, color: textPrimary, borderColor },
          ]}
          value={username}
          onChangeText={setUsername}
          placeholder="admin"
          placeholderTextColor={isDark ? "#666" : "#bbb"}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={formStyles.field}>
        <Text style={[formStyles.label, { color: textMuted }]}>Password</Text>
        <View style={formStyles.passwordRow}>
          <TextInput
            style={[
              formStyles.input,
              formStyles.passwordInput,
              { backgroundColor: inputBg, color: textPrimary, borderColor },
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={isDark ? "#666" : "#bbb"}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={formStyles.eyeBtn}
          >
            {showPassword ? (
              <EyeOff size={16} color={textMuted} strokeWidth={1.8} />
            ) : (
              <Eye size={16} color={textMuted} strokeWidth={1.8} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export type ServerFormData = Omit<Server, "id"> & { username: string; password: string };

function ServerFormDesktopModal({
  visible,
  onClose,
  onSave,
  initial,
  isDark,
  loading,
  error,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ServerFormData) => void;
  initial?: Server;
  isDark: boolean;
  loading?: boolean;
  error?: string | null;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setAddress(initial?.address ?? "");
      setUsername("");
      setPassword("");
      setShowPassword(false);
    }
  }, [visible, initial]);

  const textPrimary = isDark ? "#fefdfd" : "#1a1a1a";
  const textMuted = isDark ? "#cdc8c5" : "#888";
  const cardBg = isDark ? "#1e1e1e" : "#FFFFFF";
  const borderColor = isDark ? "#3b3a39" : "rgba(0,0,0,0.08)";
  const overlayBg = isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)";
  const canSave = name.trim() && address.trim() && !loading;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      address: address.trim(),
      username: username.trim(),
      password,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[formStyles.overlay, { backgroundColor: overlayBg }]}
        onPress={loading ? undefined : onClose}
      >
        <Pressable
          style={[formStyles.card, { backgroundColor: cardBg, borderColor }]}
          onPress={() => {}}
        >
          <View style={formStyles.header}>
            <Text style={[formStyles.title, { color: textPrimary }]}>
              {initial ? "Edit Server" : "Add Server"}
            </Text>
            <Pressable onPress={onClose} style={formStyles.closeBtn} disabled={loading}>
              <X size={18} color={textMuted} strokeWidth={1.8} />
            </Pressable>
          </View>
          <ServerFormFields
            {...{
              name,
              setName,
              address,
              setAddress,
              username,
              setUsername,
              password,
              setPassword,
              showPassword,
              setShowPassword,
              isDark,
            }}
            autoFocus
          />
          {error && (
            <Text style={[formStyles.errorText, { color: isDark ? "#FF453A" : "#FF3B30" }]}>
              {error}
            </Text>
          )}
          <View style={formStyles.actions}>
            <Pressable
              onPress={onClose}
              style={[formStyles.btn, { borderColor }]}
              disabled={loading}
            >
              <Text style={[formStyles.btnText, { color: textMuted }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[
                formStyles.btn,
                formStyles.btnPrimary,
                !canSave && { opacity: 0.4 },
              ]}
              disabled={!canSave}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[formStyles.btnText, { color: "#fff" }]}>
                  {initial ? "Save" : "Add & Connect"}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ServerFormSheet({
  visible,
  onClose,
  onSave,
  initial,
  isDark,
  loading,
  error,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ServerFormData) => void;
  initial?: Server;
  isDark: boolean;
  loading?: boolean;
  error?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const translateY = useSharedValue(SHEET_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const textPrimary = isDark ? "#fefdfd" : "#1a1a1a";
  const sheetBg = isDark ? "#1e1e1e" : "#FFFFFF";
  const sheetBottomPadding = Math.max(insets.bottom, 12);
  const keyboardInset = Math.max(0, keyboardHeight - insets.bottom);
  const maxVisibleSheetHeight = Math.max(
    280,
    windowHeight - keyboardInset - insets.top - 12,
  );
  const canSave = name.trim() && address.trim() && !loading;

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setAddress(initial?.address ?? "");
      setUsername("");
      setPassword("");
      setShowPassword(false);
      translateY.value = withTiming(0, TIMING_CONFIG);
      overlayOpacity.value = withTiming(1, TIMING_CONFIG);
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, TIMING_CONFIG);
      overlayOpacity.value = withTiming(0, TIMING_CONFIG);
      setKeyboardHeight(0);
    }
  }, [visible, initial, translateY, overlayOpacity]);

  useEffect(() => {
    if (Platform.OS === "web" || Platform.OS === "android") {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = "keyboardWillShow";
    const hideEvent = "keyboardWillHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      if (!visible) return;
      setKeyboardHeight(event.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, TIMING_CONFIG);
    overlayOpacity.value = withTiming(0, TIMING_CONFIG, () => {
      runOnJS(onClose)();
    });
  }, [translateY, overlayOpacity, onClose]);

  const panGesture = Gesture.Pan()
    .enabled(!loading)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
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
    pointerEvents:
      overlayOpacity.value > 0 ? ("auto" as const) : ("none" as const),
  }));

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      address: address.trim(),
      username: username.trim(),
      password,
    });
  };

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
        <Animated.View
          style={[
            sheetStyles.overlay,
            { backgroundColor: colors.overlay },
            overlayStyle,
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={loading ? undefined : dismiss}
          />
        </Animated.View>

        <View
          style={[
            sheetStyles.keyboardAvoider,
            { paddingBottom: keyboardInset },
          ]}
        >
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
                <View
                  style={[
                    sheetStyles.handle,
                    { backgroundColor: colors.sheetHandle },
                  ]}
                />
              </View>

              <View style={sheetStyles.sheetHeader}>
                <Text style={[sheetStyles.sheetTitle, { color: textPrimary }]}>
                  {initial ? "Edit Server" : "Add Server"}
                </Text>
              </View>

              <ScrollView
                contentContainerStyle={sheetStyles.sheetContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <ServerFormFields
                  {...{
                    name,
                    setName,
                    address,
                    setAddress,
                    username,
                    setUsername,
                    password,
                    setPassword,
                    showPassword,
                    setShowPassword,
                    isDark,
                  }}
                />

                {error && (
                  <Text
                    style={[
                      formStyles.errorText,
                      { color: isDark ? "#FF453A" : "#FF3B30" },
                    ]}
                  >
                    {error}
                  </Text>
                )}

                <Pressable
                  onPress={handleSave}
                  style={[
                    sheetStyles.sheetSaveBtn,
                    { backgroundColor: isDark ? "#fefdfd" : "#1a1a1a" },
                    !canSave && { opacity: 0.4 },
                  ]}
                  disabled={!canSave}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={isDark ? "#1a1a1a" : "#fff"}
                    />
                  ) : (
                    <Text
                      style={[
                        sheetStyles.sheetSaveBtnText,
                        { color: isDark ? "#1a1a1a" : "#fff" },
                      ]}
                    >
                      {initial ? "Save & Connect" : "Add & Connect"}
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

export function ServerFormModal(props: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ServerFormData) => void;
  initial?: Server;
  isDark: boolean;
  loading?: boolean;
  error?: string | null;
}) {
  const { isWideScreen } = useResponsiveLayout();
  if (!props.visible) return null;
  if (isWideScreen) {
    return <ServerFormDesktopModal {...props} />;
  }
  return <ServerFormSheet {...props} />;
}
const sheetStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoider: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: SHEET_HEIGHT,
  },
  handleBar: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: Fonts.sansSemiBold,
  },
  sheetContent: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 8,
  },
  sheetSaveBtn: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 8,
  },
  sheetSaveBtnText: {
    fontSize: 15,
    fontFamily: Fonts.sansSemiBold,
  },
});

const formStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 12,
    borderWidth: 0.633,
    padding: 24,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.sansSemiBold,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  fields: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 40,
    borderRadius: 6,
    borderWidth: 0.633,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 0.633,
  },
  btnPrimary: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },
  btnText: {
    fontSize: 13,
    fontFamily: Fonts.sansSemiBold,
  },
  errorText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
});
