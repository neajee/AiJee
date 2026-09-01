import { memo, useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, ChevronDown, Pencil, X } from "lucide-react-native";
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

const COLLAPSE_AFTER_LINES = 12;
const COLLAPSE_AFTER_CHARS = 1600;

function previewText(text: string): { preview: string; collapsible: boolean } {
  const lines = text.split("\n");
  const collapsible = lines.length > COLLAPSE_AFTER_LINES || text.length > COLLAPSE_AFTER_CHARS;
  if (!collapsible) return { preview: text, collapsible: false };
  const preview = lines.slice(0, COLLAPSE_AFTER_LINES).join("\n");
  return { preview: `${preview.slice(0, COLLAPSE_AFTER_CHARS)}\n…`, collapsible: true };
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
  const { preview, collapsible } = useMemo(() => previewText(message.text), [message.text]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => setExpanded(false), [message.id, message.text]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const collapse = () => setExpanded(false);
    window.addEventListener("blur", collapse);
    return () => window.removeEventListener("blur", collapse);
  }, []);

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
          <>
            <Text style={[styles.text, { color: colors.text }]} selectable>
              {expanded || !collapsible ? message.text : preview}
            </Text>
            {collapsible && (
              <View style={styles.disclosureRow}>
                <View style={[styles.disclosureLine, { backgroundColor: colors.border }]} />
                <Pressable
                  onPress={() => setExpanded((value) => !value)}
                  accessibilityRole="button"
                  accessibilityLabel={expanded ? "收起长消息" : "展开长消息"}
                  style={({ pressed }) => [styles.disclosure, pressed && styles.disclosurePressed]}
                >
                  <Text style={[styles.disclosureText, { color: colors.textTertiary }]}>{expanded ? "收起" : "展开全文"}</Text>
                  <ChevronDown size={12} color={colors.textTertiary} style={expanded && styles.disclosureIconExpanded} />
                </Pressable>
                <View style={[styles.disclosureLine, { backgroundColor: colors.border }]} />
              </View>
            )}
          </>
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
  disclosureRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 10 },
  disclosureLine: { height: StyleSheet.hairlineWidth, flex: 1 },
  disclosure: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 24, paddingHorizontal: 2 },
  disclosurePressed: { opacity: 0.68 },
  disclosureText: { fontSize: 12, fontFamily: Fonts.sansMedium },
  disclosureIconExpanded: { transform: [{ rotate: "180deg" }] },
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
