import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import {
  SettingsGroup,
  SettingsHeadingProvider,
  SettingsLayoutProvider,
  SettingsRow,
  useSettingsContentStyle,
  useSettingsMetrics,
  useSettingsPalette,
  useSettingsPhoneLayout,
} from './settings-list';
import { SETTINGS_SECTIONS, type SettingsSection } from '../sections';

/**
 * Two shapes of the same content:
 *
 *  - narrow viewport → `SettingsIndexScreen` renders a drill-down list, one row
 *    per topic, and each topic gets its own screen (`SettingsDetailScreen`).
 *  - wide viewport   → the list would waste the space, so the index stacks
 *    every section on one scrollable page, as before.
 *
 * Detail screens stay reachable at any width so /settings/<slug> deep links and
 * browser back/forward keep working.
 */

// ─── Screen shell ─────────────────────────────────────────────

function SettingsScroll({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const p = useSettingsPalette();
  const contentStyle = useSettingsContentStyle(insets.bottom);

  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

// ─── Index ────────────────────────────────────────────────────

export function SettingsIndexScreen({
  isDark,
  onOpenSection,
}: {
  isDark: boolean;
  /** Navigate to the topic's own screen. Only called on narrow viewports. */
  onOpenSection: (section: SettingsSection) => void;
}) {
  const phone = useSettingsPhoneLayout();
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <SettingsLayoutProvider phone={phone}>
      <SettingsScroll>
        <Text
          style={[
            styles.title,
            { fontSize: m.titleSize, color: p.text, paddingVertical: m.gutter / 2 },
          ]}
        >
          设置
        </Text>

        {phone ? (
          <SettingsGroup>
            {SETTINGS_SECTIONS.map((section, i) => {
              const isLast = i === SETTINGS_SECTIONS.length - 1;
              // Topics that carry their own row resolve inline instead of
              // pushing a screen (theme picker, agent version/update).
              if (section.Row) {
                const InlineRow = section.Row;
                return <InlineRow key={section.slug} isLast={isLast} />;
              }
              return (
                <SettingsRow
                  key={section.slug}
                  icon={section.icon}
                  label={section.title}
                  description={section.summary}
                  isLast={isLast}
                  onPress={() => onOpenSection(section)}
                  right={
                    <ChevronRight size={m.chevronSize} color={p.textTertiary} strokeWidth={2} />
                  }
                />
              );
            })}
          </SettingsGroup>
        ) : (
          SETTINGS_SECTIONS.map(({ slug, Component }) => <Component key={slug} isDark={isDark} />)
        )}
      </SettingsScroll>
    </SettingsLayoutProvider>
  );
}

// ─── Detail ───────────────────────────────────────────────────

export function SettingsDetailScreen({
  section,
  isDark,
  onBack,
}: {
  section: SettingsSection;
  isDark: boolean;
  onBack: () => void;
}) {
  const phone = useSettingsPhoneLayout();
  const { Component } = section;

  return (
    <SettingsLayoutProvider phone={phone}>
      <SettingsDetailChrome title={section.title} onBack={onBack}>
        {/* The screen title already names the section, so suppress the
            in-content heading that the stacked page relies on. */}
        <SettingsHeadingProvider visible={false}>
          <Component isDark={isDark} />
        </SettingsHeadingProvider>
      </SettingsDetailChrome>
    </SettingsLayoutProvider>
  );
}

function SettingsDetailChrome({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const contentStyle = useSettingsContentStyle(insets.bottom);

  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      {/* Single-line nav bar rather than a nav bar plus a large in-page title:
          the app shell already renders a header above this on narrow
          viewports, and three stacked bars is too much chrome. Top inset is
          handled by that shell, so it is not applied again here. */}
      <View style={[styles.navBar, { borderBottomColor: p.separator }]}>
        <View
          style={[
            styles.navBarInner,
            {
              paddingHorizontal: m.gutter - 6,
              maxWidth: m.contentMaxWidth,
              minHeight: m.rowMinHeight + 4,
            },
          ]}
        >
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="返回设置"
            hitSlop={8}
            style={({ pressed }) => [
              styles.backBtn,
              { width: m.rowMinHeight - 8, height: m.rowMinHeight - 8 },
              pressed && { opacity: 0.55 },
            ]}
          >
            <ChevronLeft size={m.chevronSize + 6} color={p.text} strokeWidth={2} />
          </Pressable>
          <Text
            style={[styles.navTitle, { fontSize: m.labelSize + 1, color: p.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  title: {
    fontFamily: Fonts.sansBold,
  },
  navBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    // Lines the back button up with the content column on wide viewports.
    alignSelf: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontFamily: Fonts.sansSemiBold,
    flex: 1,
  },
});
