import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Check, Circle, CircleDot, X } from "lucide-react-native";
import { styles } from "./styles";
import type { ExtensionUiController } from "../../hooks/use-extension-ui-controller";

export function ExtensionUiView({ controller }: { controller: ExtensionUiController }) {
  const { theme, mutation, request, selectedOption, setSelectedOption, draft, setDraft, title, timeoutText, submit, handleCancel, canSubmitSelect } = controller;
  if (!request) return null;
  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.dropdownBg,
            borderColor: theme.dropdownBorder,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            { borderBottomColor: theme.dropdownBorder },
          ]}
        >
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {title}
            </Text>
            {request.message ? (
              <Text style={[styles.message, { color: theme.textMuted }]}>
                {request.message}
              </Text>
            ) : null}
            {timeoutText ? (
              <Text style={[styles.timeout, { color: theme.sectionColor }]}>
                {timeoutText}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={handleCancel}
            disabled={mutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Dismiss question"
            style={({ pressed, hovered }: any) => [
              styles.dismissButton,
              (pressed || hovered) && { backgroundColor: theme.hoverBg },
            ]}
          >
            <X size={16} color={theme.textMuted} strokeWidth={1.8} />
          </Pressable>
        </View>

        {request.method === "select" && (
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {request.options.map((option) => {
              const isSelected = selectedOption === option;
              return (
                <Pressable
                  key={`${request.id}-${option}`}
                  onPress={() => setSelectedOption(option)}
                  style={({ pressed, hovered }: any) => [
                    styles.optionRow,
                    isSelected && { backgroundColor: theme.selectedBg },
                    (pressed || hovered) &&
                      !isSelected && { backgroundColor: theme.hoverBg },
                  ]}
                >
                  {isSelected ? (
                    <CircleDot
                      size={16}
                      color={theme.accentColor}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Circle
                      size={16}
                      color={theme.textMuted}
                      strokeWidth={1.8}
                    />
                  )}
                  <Text style={[styles.optionText, { color: theme.textPrimary }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {request.method === "confirm" && (
          <View style={styles.actionArea}>
            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => submit({ confirmed: false })}
                disabled={mutation.isPending}
                style={[
                  styles.secondaryButton,
                  { borderColor: theme.toolbarBorder },
                ]}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.textPrimary },
                  ]}
                >
                  No
                </Text>
              </Pressable>
              <Pressable
                onPress={() => submit({ confirmed: true })}
                disabled={mutation.isPending}
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.colors.text },
                ]}
              >
                <Check
                  size={14}
                  color={theme.colors.background}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: theme.colors.background },
                  ]}
                >
                  Yes
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {request.method === "input" && (
          <View style={styles.actionArea}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={request.placeholder ?? "Type your response"}
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                {
                  color: theme.textPrimary,
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                },
              ]}
              autoFocus
              autoCorrect={false}
              editable={!mutation.isPending}
              returnKeyType="done"
              onSubmitEditing={() => submit({ value: draft })}
            />
          </View>
        )}

        {request.method === "editor" && (
          <View style={styles.actionArea}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Edit the text"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.editor,
                {
                  color: theme.textPrimary,
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                },
              ]}
              autoFocus
              multiline
              textAlignVertical="top"
              editable={!mutation.isPending}
            />
          </View>
        )}

        {request.method !== "confirm" && (
          <View
            style={[
              styles.footer,
              { borderTopColor: theme.dropdownBorder },
            ]}
          >
            <Pressable
              onPress={handleCancel}
              disabled={mutation.isPending}
              style={[
                styles.secondaryButton,
                { borderColor: theme.toolbarBorder },
              ]}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.textPrimary },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                submit({
                  value: request.method === "select" ? selectedOption : draft,
                })
              }
              disabled={mutation.isPending || !canSubmitSelect}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.colors.text,
                  opacity:
                    mutation.isPending || !canSubmitSelect ? 0.45 : 1,
                },
              ]}
            >
              {mutation.isPending ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.background}
                />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: theme.colors.background },
                  ]}
                >
                  Submit
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {mutation.isError && (
          <View style={styles.errorWrap}>
            <Text style={[styles.errorText, { color: theme.colors.destructive }]}>
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Failed to send the response"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

}
