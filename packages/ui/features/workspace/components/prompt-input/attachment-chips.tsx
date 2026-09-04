import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X, FileText, ImageIcon } from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import { Attachment } from '../../utils/prompt-input';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';

interface AttachmentChipsProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export function AttachmentChips({ attachments, onRemove }: AttachmentChipsProps) {
  const theme = usePromptTheme();

  if (attachments.length === 0) return null;

  const imageAtts = attachments.filter((a) => a.type === 'image');
  const fileAtts = attachments.filter((a) => a.type !== 'image');

  return (
    <View style={styles.container}>
      {imageAtts.length > 0 && (
        <View style={styles.imageRow}>
          {imageAtts.map((att) => (
            <View
              key={att.id}
              style={[styles.imageWrap, { borderColor: theme.cardBorder }]}
            >
              {att.preview ? (
                <Image source={{ uri: att.preview }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <ImageIcon size={18} color={theme.textMuted} strokeWidth={1.8} />
                </View>
              )}
              <Pressable
                onPress={() => onRemove(att.id)}
                style={[
                  styles.removeBadge,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(0,0,0,0.6)'
                      : 'rgba(255,255,255,0.92)',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Remove image"
                hitSlop={6}
              >
                <X size={11} color={theme.isDark ? '#fff' : '#333'} strokeWidth={2.5} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {fileAtts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.fileRow}
          contentContainerStyle={styles.fileContent}
        >
          {fileAtts.map((att) => (
            <View
              key={att.id}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.isDark ? '#252525' : '#E8E8E8',
                  borderColor: theme.isDark ? '#3b3a39' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <FileText size={14} color={theme.textMuted} strokeWidth={1.8} />
              <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
                {att.name}
              </Text>
              {att.size != null && (
                <Text style={[styles.size, { color: theme.textMuted }]}>
                  {att.size > 1024 * 1024
                    ? `${(att.size / (1024 * 1024)).toFixed(1)}MB`
                    : att.size > 1024
                      ? `${(att.size / 1024).toFixed(0)}KB`
                      : `${att.size}B`}
                </Text>
              )}
              <Pressable
                onPress={() => onRemove(att.id)}
                style={styles.remove}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${att.name}`}
              >
                <X size={12} color={theme.textMuted} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageWrap: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 0.633,
    overflow: 'visible',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  removeBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileRow: {
    maxHeight: 48,
  },
  fileContent: {
    gap: 6,
    paddingBottom: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingLeft: 6,
    paddingRight: 4,
    borderRadius: 8,
    borderWidth: 0.633,
  },
  name: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    maxWidth: 120,
  },
  size: {
    fontSize: 11,
    fontFamily: Fonts.sans,
  },
  remove: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
