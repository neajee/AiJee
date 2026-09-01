import { memo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { ChatMessage } from "../../types";

interface UserMessageProps {
  message: ChatMessage;
  isDark: boolean;
}

export const UserMessage = memo(function UserMessage({
  message,
  isDark,
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
        {!!message.text && (
          <Text style={[styles.text, { color: colors.text }]} selectable>
            {message.text}
          </Text>
        )}
      </View>
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
});
