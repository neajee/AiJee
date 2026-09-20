import { Animated } from "@/styles/motion";
import { Search } from 'lucide-react';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useCommandPaletteController } from '../../hooks/use-command-palette-controller';
import type { CommandPaletteProps } from './component-types';
export function CommandPalette({
  visible,
  onClose
}: CommandPaletteProps) {
  const colors = useThemeTokens();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const textDim = isDark ? '#888' : '#999';
  const bg = isDark ? '#1e1e1e' : '#FFFFFF';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const hoverBg = isDark ? '#2a2a2a' : '#F0F0F0';
  const selectedBg = isDark ? '#333' : '#E8E8E8';
  const controller = useCommandPaletteController({
    visible,
    onClose
  });
  const {
    search,
    setSearch,
    selectedIndex,
    sessionsLoading,
    sections,
    inputRef,
    scrollRef,
    itemRefs,
    scrollContentRef,
    overlayAnim,
    scaleAnim,
    handleClose,
    handleKeyPress
  } = controller;
  if (!visible) return null;
  let flatIndex = 0;
  return <div>
      <div className="flex flex-col">
        <AnimatedOverlay animation={overlayAnim} onClick={handleClose} />
        <div className={"  opacity-100"}>
          <div>
            <Search size={16} color={textMuted} strokeWidth={2} />
            <input ref={inputRef} value={search} onChange={event => setSearch(event.target.value)} onKeyPress={handleKeyPress} placeholder="搜索对话…" />
          </div>
          <div ref={scrollRef} className="flex flex-col" keyboardShouldPersistTaps="handled">
            <div ref={scrollContentRef}>
              {sessionsLoading ? <div className="flex flex-col">
                  <span className="size-3 animate-spin" />
                </div> : sections.length === 0 ? <div className="flex flex-col">
                  <span>
                    {search.trim() ? '没有匹配的对话' : '暂无最近对话'}
                  </span>
                </div> : null}
              {sections.map(section => <div key={section.title}>
                  <span>{section.title}</span>
                  {section.items.map(item => {
                const index = flatIndex++;
                const isSelected = index === selectedIndex;
                const Icon = item.icon;
                return <button key={item.id} ref={ref => {
                  itemRefs.current[index] = ref as any;
                }} onClick={item.onSelect}>
                        <Icon size={15} color={isSelected ? textPrimary : textMuted} strokeWidth={1.8} />
                        <div className="flex flex-col">
                          <span>
                            {item.label}
                          </span>
                          {item.description && <span>
                              {item.description}
                            </span>}
                        </div>
                        {isSelected && <span>{'\u21B5'}</span>}
                      </button>;
              })}
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
}
function AnimatedOverlay({
  animation,
  onPress
}: {
  animation: {
    value: number;
  };
  onPress: () => void;
}) {
  return <div className={"  opacity-100"}>
      <button className="inline-flex items-center" onClick={onPress} />
    </div>;
}
