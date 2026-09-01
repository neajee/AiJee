import { memo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, Pencil, X } from "lucide-react-native";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../../types";

interface UserMessageProps {
  message: ChatMessage;
  isDark: boolean;
  editing?: boolean;
  editText?: string;
  onEdit?: () => void;
  onChangeEdit?: (text: string) => void;
  onCancelEdit?: () => void;
  onSubmitEdit?: () => void;
}

export const UserMessage = memo(function UserMessage({
  message,
  isDark,
  editing = false,
  editText = message.text,
  onEdit,
  onChangeEdit,
  onCancelEdit,
  onSubmitEdit,
}: UserMessageProps) {
  const colors = useThemeTokens();
  const attachments = message.attachments ?? [];
  const images = attachments.filter((a) => a.type === "image" && !!a.data);

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: colors.surfaceRaised }]}>
        {images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.images}
            contentContainerStyle={styles.imagesContent}
          >
            {images.map((img) => (
              <Image
                key={img.id}
                source={{ uri: `data:${img.mimeType || "image/png"};base64,${img.data}` }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}
        {editing ? (
          <>
            <TextInput
              autoFocus
              multiline
              value={editText}
              onChangeText={onChangeEdit}
              style={[styles.editor, { color: colors.text, borderColor: colors.border }]}
              selectionColor={colors.tint}
            />
            <View style={styles.editActions}>
              <Pressable onPress={onCancelEdit} accessibilityLabel="Cancel edit" style={styles.editButton}>
                <X size={14} color={colors.textTertiary} />
              </Pressable>
              <Pressable onPress={onSubmitEdit} disabled={!editText.trim()} accessibilityLabel="Send edited message" style={[styles.editButton, { backgroundColor: colors.tint }]}>
                <Check size={14} color={colors.background} />
              </Pressable>
            </View>
          </>
        ) : !!message.text && (
          <Text style={[styles.text, { color: colors.text }]} selectable>
            {message.text}
          </Text>
        )}
      </View>
      {!editing && onEdit && (
        <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit message" style={styles.editTrigger}>
          <Pencil size={13} color={colors.textTertiary} strokeWidth={1.8} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "85%",
  },
  images: {
    marginBottom: 6,
  },
  imagesContent: {
    gap: 6,
    flexDirection: "row",
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.sans,
  },
  editor: {
    minWidth: 220,
    minHeight: 64,
    maxHeight: 180,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.sans,
  },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 6, marginTop: 6 },
  editButton: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  editTrigger: { marginTop: 2, padding: 5, opacity: 0.75 },
});
