import { Input, ScrollView, Spinner, Text, View } from 'tamagui';
import { memo } from "react";
import { Pressable } from "react-native";
import { Plus } from "lucide-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { BrowserPreview } from "@/features/preview/components/browser-preview";
import { usePreviewPanelController } from "../../hooks/use-preview-panel-controller";
import { styles } from "./styles";

interface PreviewPanelProps {
  sessionId: string | null;
}

function PreviewPanelComponent({ sessionId }: PreviewPanelProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const controller = usePreviewPanelController(sessionId);
  const {
    serverUrl,
    accessToken,
    targets,
    suggestions,
    selectedTarget,
    selectTarget,
    portInput,
    setPortInput,
    showPortInput,
    setShowPortInput,
    handleAddPort,
    handleAddSuggestion,
  } = controller;

  if (!sessionId) {
    return (
      <View style={[styles.emptyState, { backgroundColor: isDark ? "#151515" : "#FAFAFA" }]}>
        <Text style={[styles.emptyTitle, { color: isDark ? "#F5F5F5" : "#1A1A1A" }]}>Preview</Text>
        <Text style={[styles.emptyBody, { color: isDark ? "#8B8685" : "#6B6B6B" }]}>
          Open a session to preview running apps.
        </Text>
      </View>
    );
  }

  if (targets.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: isDark ? "#151515" : "#FAFAFA" }]}>
        <Text style={[styles.emptyTitle, { color: isDark ? "#F5F5F5" : "#1A1A1A" }]}>Preview</Text>
        <Text style={[styles.emptyBody, { color: isDark ? "#8B8685" : "#6B6B6B" }]}>
          Add a port to preview a running app.
        </Text>
        <View style={styles.addPortRow}>
          <Input
            style={[
              styles.portInput,
              {
                color: isDark ? "#F5F5F5" : "#1A1A1A",
                backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
                borderColor: isDark ? "#3A3A3A" : "#D5D5D5",
              },
            ]}
            placeholder="Port (e.g. 3000)"
            placeholderTextColor={isDark ? "#6B6B6B" : "#999"}
            value={portInput}
            onChangeText={setPortInput}
            keyboardType="number-pad"
            onSubmitEditing={handleAddPort}
          />
          <Pressable
            onPress={handleAddPort}
            disabled={!portInput.trim()}
            style={({ pressed }) => [
              styles.addPortBtn,
              {
                backgroundColor: isDark ? "#2B2A2A" : "#EDEDED",
                opacity: !portInput.trim() ? 0.4 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.addPortBtnText, { color: isDark ? "#F5F5F5" : "#1A1A1A" }]}>
              Add
            </Text>
          </Pressable>
        </View>
        {suggestions.length > 0 && (
          <View style={styles.suggestionsWrap}>
            <Text style={[styles.suggestionsLabel, { color: isDark ? "#8B8685" : "#6B6B6B" }]}>
              Detected ports
            </Text>
            <View style={styles.suggestionsRow}>
              {suggestions.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => handleAddSuggestion(s)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    {
                      backgroundColor: isDark ? "#1E1E1E" : "#F2F2F2",
                      borderColor: isDark ? "#3A3A3A" : "#E3E3E3",
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[styles.suggestionChipText, { color: isDark ? "#B9B4B1" : "#555" }]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#151515" : "#FAFAFA" }]}>
      <View
        style={[styles.toolbar, { borderBottomColor: isDark ? "#323131" : "rgba(0,0,0,0.08)" }]}
      >
        <Text style={[styles.title, { color: isDark ? "#F5F5F5" : "#1A1A1A" }]}>Preview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.targetList}>
          {targets.map((target) => {
            const active = selectedTarget?.id === target.id;
            return (
              <Pressable
                key={target.id}
                onPress={() => selectTarget(sessionId, target.id)}
                style={({ pressed }) => [
                  styles.targetChip,
                  {
                    backgroundColor: active
                      ? isDark ? "#2B2A2A" : "#EDEDED"
                      : isDark ? "#1B1B1B" : "#F2F2F2",
                    borderColor: active
                      ? isDark ? "#4A4848" : "#D5D5D5"
                      : isDark ? "#2E2E2E" : "#E3E3E3",
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.targetChipLabel,
                    {
                      color: active
                        ? isDark ? "#F5F5F5" : "#1A1A1A"
                        : isDark ? "#B9B4B1" : "#555555",
                    },
                  ]}
                >
                  {target.label}
                </Text>
              </Pressable>
            );
          })}
          {showPortInput ? (
            <View style={styles.inlinePortRow}>
              <Input
                autoFocus
                style={[
                  styles.inlinePortInput,
                  {
                    color: isDark ? "#F5F5F5" : "#1A1A1A",
                    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
                    borderColor: isDark ? "#3A3A3A" : "#D5D5D5",
                  },
                ]}
                placeholder="Port"
                placeholderTextColor={isDark ? "#6B6B6B" : "#999"}
                value={portInput}
                onChangeText={setPortInput}
                keyboardType="number-pad"
                onSubmitEditing={handleAddPort}
                onBlur={() => {
                  if (!portInput.trim()) setShowPortInput(false);
                }}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setShowPortInput(true)}
              style={({ pressed }) => [
                styles.addChipBtn,
                { borderColor: isDark ? "#2E2E2E" : "#E3E3E3" },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Plus size={14} color={isDark ? "#8B8685" : "#999"} strokeWidth={1.8} />
            </Pressable>
          )}
        </ScrollView>
      </View>
      <View style={styles.content}>
        {selectedTarget ? (
          <BrowserPreview
            serverUrl={serverUrl}
            accessToken={accessToken}
            sessionId={sessionId}
            target={selectedTarget}
          />
        ) : (
          <View style={styles.loadingState}>
            <Spinner size="small" />
          </View>
        )}
      </View>
    </View>
  );
}

export const PreviewPanel = memo(PreviewPanelComponent);
