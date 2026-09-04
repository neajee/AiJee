import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useCommandPaletteController } from '../../hooks/use-command-palette-controller';
import { styles } from './styles';
import type { CommandPaletteProps } from './types';

export function CommandPalette({ visible, onClose }: CommandPaletteProps) {
  const colors = useThemeTokens();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const textPrimary = isDark ? '#fefdfd' : colors.text;
  const textMuted = isDark ? '#cdc8c5' : colors.textTertiary;
  const textDim = isDark ? '#888' : '#999';
  const bg = isDark ? '#1e1e1e' : '#FFFFFF';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.12)';
  const hoverBg = isDark ? '#2a2a2a' : '#F0F0F0';
  const selectedBg = isDark ? '#333' : '#E8E8E8';
  const controller = useCommandPaletteController({ visible, onClose });
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
    handleKeyPress,
  } = controller;

  if (!visible) return null;
  let flatIndex = 0;
  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        <AnimatedOverlay animation={overlayAnim} onPress={handleClose} />
        <Animated.View
          style={[
            styles.palette,
            {
              backgroundColor: bg,
              borderColor,
              transform: [{ scale: scaleAnim }],
              opacity: overlayAnim,
            },
          ]}
        >
          <View style={[styles.searchRow, { borderBottomColor: borderColor }]}>
            <Search size={16} color={textMuted} strokeWidth={2} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: textPrimary }]}
              value={search}
              onChangeText={setSearch}
              onKeyPress={handleKeyPress}
              placeholder="搜索对话…"
              placeholderTextColor={textDim}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
            />
          </View>
          <ScrollView
            ref={scrollRef}
            style={styles.results}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View ref={scrollContentRef}>
              {sessionsLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="small" color={textMuted} />
                </View>
              ) : sections.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: textDim }]}>
                    {search.trim() ? '没有匹配的对话' : '暂无最近对话'}
                  </Text>
                </View>
              ) : null}
              {sections.map((section) => (
                <View key={section.title}>
                  <Text style={[styles.sectionHeader, { color: textDim }]}>{section.title}</Text>
                  {section.items.map((item) => {
                    const index = flatIndex++;
                    const isSelected = index === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <Pressable
                        key={item.id}
                        ref={(ref) => {
                          itemRefs.current[index] = ref as any;
                        }}
                        onPress={item.onSelect}
                        style={({ pressed, hovered }: any) => [
                          styles.item,
                          isSelected && { backgroundColor: selectedBg },
                          !isSelected && (pressed || hovered) && { backgroundColor: hoverBg },
                        ]}
                      >
                        <Icon size={15} color={isSelected ? textPrimary : textMuted} strokeWidth={1.8} />
                        <View style={styles.itemText}>
                          <Text style={[styles.itemLabel, { color: textPrimary }]} numberOfLines={1}>
                            {item.label}
                          </Text>
                          {item.description && (
                            <Text style={[styles.itemDesc, { color: textMuted }]} numberOfLines={1}>
                              {item.description}
                            </Text>
                          )}
                        </View>
                        {isSelected && <Text style={[styles.enterHint, { color: textDim }]}>{'\u21B5'}</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function AnimatedOverlay({ animation, onPress }: { animation: import('react-native').Animated.Value; onPress: () => void }) {
  return (
    <Animated.View style={[styles.overlay, { opacity: animation }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
    </Animated.View>
  );
}
