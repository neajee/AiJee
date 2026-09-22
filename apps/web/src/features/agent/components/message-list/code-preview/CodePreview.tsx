import { memo, useMemo } from 'react';
import { tokenizeLine } from '../../../utils/code-preview-tokens';
import type { CodePreviewProps } from './component-types';
export const CodePreview = memo(function CodePreview({
  code,
  maxHeight,
  startLine = 1,
  language,
  diffLanguage,
  showLineNumbers = true,
  fill = false,
  bare = false,
  surface = 'muted'
}: CodePreviewProps) {
  const lines = useMemo(() => code.split('\n'), [code]);
  // Borderless so an expanded tool result reads as a continuation of its header;
  // only the bottom corners round off.
  const surfaceClass = surface === 'background' ? 'bg-background' : surface === 'code' ? 'bg-[var(--aijee-code-background)]' : 'bg-muted';
  return <div className={`min-w-0 overflow-hidden ${surfaceClass} ${bare ? '' : 'rounded-b-md'}`}>
      <div className={fill ? "overflow-auto" : "max-h-80 overflow-auto"} style={maxHeight ? { maxHeight } : undefined}>
        <div className="min-w-max p-3 font-mono text-caption leading-5">
            {lines.map((line, index) => {
            const segments = tokenizeLine(line, language, diffLanguage);
            return <div key={index} className="flex">
                  {showLineNumbers ? <div className="w-10 shrink-0 select-none text-right pr-3">
                      <span className={"  text-text-tertiary"}>{startLine + index}</span>
                    </div> : null}
                  <span className={"  text-foreground"}>
                    {segments.length ? segments.map((segment, segmentIndex) => <span key={`${index}-${segmentIndex}`} className="inline-block">
                            {segment.text || (segmentIndex === 0 ? ' ' : '')}
                          </span>) : ' '}
                  </span>
                </div>;
          })}
        </div>
      </div>
    </div>;
});
