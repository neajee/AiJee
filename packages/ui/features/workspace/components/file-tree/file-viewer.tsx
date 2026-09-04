import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useFileRead } from '@aijee/client-sdk';
import { CodePreview } from '@/features/agent/components/message-list/code-preview';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { basename, languageOf } from '../../utils/file-tree';
import { styles } from './styles';

export function FileViewer({
  filePath,
  rootPath,
  onClose,
}: {
  filePath: string;
  rootPath: string;
  onClose: () => void;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const textPrimary = isDark ? "#fefdfd" : colors.text;
  const textMuted = isDark ? "#cdc8c5" : colors.textTertiary;
  const headerBg = isDark ? "#1a1a1a" : "#F0F0F0";
  const headerBorder = isDark ? "#323131" : "rgba(0,0,0,0.08)";
  const hoverBg = isDark ? "#252525" : "#E8E8E8";

  const fileName = basename(filePath);
  // Where the file sits, from the workspace root down to its directory.
  const relative = filePath.startsWith(rootPath)
    ? filePath.slice(rootPath.replace(/\/+$/, "").length + 1)
    : filePath;
  const trail = [
    basename(rootPath),
    ...relative.split("/").slice(0, -1),
  ]
    .filter(Boolean)
    .join(" › ");

  const { data: fileData, isLoading, error: fileError } = useFileRead(filePath);

  return (
    <View style={styles.viewerContainer}>
      {/* Sticky header */}
      <View
        style={[
          styles.viewerHeader,
          { backgroundColor: headerBg, borderBottomColor: headerBorder },
        ]}
      >
        <Pressable
          onPress={onClose}
          accessibilityLabel="Close file"
          {...{ title: "Close file" }}
          style={({ pressed, hovered }: any) => [
            styles.closeButton,
            (pressed || hovered) && { backgroundColor: hoverBg },
          ]}
        >
          {/* There is no page to go back to; this clears the open file. */}
          <X size={13} color={textMuted} strokeWidth={2} />
        </Pressable>
        {/* The trail may lose its middle; the filename never does. */}
        <Text style={[styles.crumbTrail, { color: textMuted }]} numberOfLines={1}>
          {trail}
        </Text>
        <Text style={[styles.crumbSeparator, { color: textMuted }]}>›</Text>
        <Text style={[styles.crumbName, { color: textPrimary }]} numberOfLines={1}>
          {fileName}
        </Text>
        {fileData?.truncated && (
          <Text style={[styles.viewerMeta, { color: textMuted }]}>truncated</Text>
        )}
      </View>

      {/* Scrollable content */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : fileError ? (
        <View style={styles.viewerMessageWrap}>
          <Text style={[styles.emptyText, { color: textMuted }]}>
            {fileError.includes("non-UTF8")
              ? "Binary file preview is not available."
              : "Cannot read file"}
          </Text>
        </View>
      ) : fileData ? (
        <CodePreview
          code={fileData.content}
          isDark={isDark}
          language={languageOf(filePath)}
          bare
          fill
        />
      ) : null}
    </View>
  );
}
