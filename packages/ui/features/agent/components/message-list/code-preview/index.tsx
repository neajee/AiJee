import { memo, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { tokenizeLine } from '../../../utils/code-preview-tokens';
import { styles } from './styles';
import type { CodePreviewProps } from './types';

export const CodePreview = memo(function CodePreview({
  code,
  isDark,
  maxHeight,
  startLine = 1,
  language,
  diffLanguage,
  showLineNumbers = true,
  fill = false,
  bare = false,
}: CodePreviewProps) {
  const colors = useThemeTokens();
  const lines = useMemo(() => code.split('\n'), [code]);
  const tokenColors = useMemo(
    () => ({
      plain: isDark ? '#D4D4D4' : '#24292E',
      keyword: isDark ? '#C792EA' : '#6F42C1',
      string: isDark ? '#C3E88D' : '#0B6E4F',
      number: isDark ? '#F78C6C' : '#B75501',
      comment: isDark ? '#6A9955' : '#6A737D',
      operator: isDark ? '#89DDFF' : '#005CC5',
      property: isDark ? '#82AAFF' : '#005CC5',
      punctuation: isDark ? '#89DDFF' : '#586069',
      diffAdd: colors.diffAdded,
      diffRemove: colors.diffRemoved,
      diffMeta: colors.skill,
    }),
    [colors, isDark],
  );

  return (
    <View
      style={[
        bare
          ? styles.bareContainer
          : [styles.container, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }],
        fill && styles.fillContainer,
      ]}
    >
      <ScrollView
        style={maxHeight ? { maxHeight } : undefined}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {lines.map((line, index) => {
              const segments = tokenizeLine(line, language, diffLanguage);
              return (
                <View key={index} style={styles.row}>
                  {showLineNumbers ? (
                    <View style={[styles.lineNoCol, { borderRightColor: colors.border }]}>
                      <Text style={[styles.lineNo, { color: colors.textTertiary }]}>{startLine + index}</Text>
                    </View>
                  ) : null}
                  <Text
                    style={[
                      styles.lineText,
                      !showLineNumbers && styles.lineTextNoGutter,
                      bare && styles.lineTextBare,
                      { color: tokenColors.plain },
                    ]}
                  >
                    {segments.length
                      ? segments.map((segment, segmentIndex) => (
                          <Text key={`${index}-${segmentIndex}`} style={{ color: tokenColors[segment.kind] }}>
                            {segment.text || (segmentIndex === 0 ? ' ' : '')}
                          </Text>
                        ))
                      : ' '}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
});
