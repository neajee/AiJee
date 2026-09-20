import { memo, useMemo } from 'react';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { tokenizeLine } from '../../../utils/code-preview-tokens';
import type { CodePreviewProps } from './component-types';
export const CodePreview = memo(function CodePreview({
  code,
  isDark,
  maxHeight,
  startLine = 1,
  language,
  diffLanguage,
  showLineNumbers = true,
  fill = false,
  bare = false
}: CodePreviewProps) {
  const colors = useThemeTokens();
  const lines = useMemo(() => code.split('\n'), [code]);
  const tokenColors = useMemo(() => ({
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
    diffMeta: colors.skill
  }), [colors, isDark]);
  return <div className={"  bg-surface-raised border-border"}>
      <div className={"max-h-0"} nestedScrollEnabled>
        <div horizontal>
          <div>
            {lines.map((line, index) => {
            const segments = tokenizeLine(line, language, diffLanguage);
            return <div key={index} className={"block"}>
                  {showLineNumbers ? <div className={" "}>
                      <span className={"  text-text-tertiary"}>{startLine + index}</span>
                    </div> : null}
                  <span className={"  text-foreground"}>
                    {segments.length ? segments.map((segment, segmentIndex) => <span key={`${index}-${segmentIndex}`} className={"block"}>
                            {segment.text || (segmentIndex === 0 ? ' ' : '')}
                          </span>) : ' '}
                  </span>
                </div>;
          })}
          </div>
        </div>
      </div>
    </div>;
});
