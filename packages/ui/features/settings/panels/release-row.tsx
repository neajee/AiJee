import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useSettingsPalette } from "@/components/settings-surface";
import { formatReleaseShort, formatReleaseTime, type VersionInfo } from "../utils/about";
import { aboutStyles } from "../utils/about-styles";
/** One collapsible release row in the changelog timeline. */
export function ReleaseRow({
  release,
  current,
  defaultOpen,
}: {
  release: NonNullable<VersionInfo['timeline']>[number];
  current: boolean;
  defaultOpen: boolean;
}) {
  const p = useSettingsPalette();
  const [open, setOpen] = useState(defaultOpen);
  const notes = release.notes ?? [];
  const featureTotal = notes.filter((note) => note.type === 'feature').length;
  const fixTotal = notes.filter((note) => note.type === 'fix').length;
  const otherTotal = notes.filter((note) => note.type === 'other').length;
  const countText =
    [featureTotal && `${featureTotal} 新功能`, fixTotal && `${fixTotal} 修复`, otherTotal && `${otherTotal} 其他`]
      .filter(Boolean)
      .join(' · ') || '无变更记录';

  return (
    <View>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={`${release.tag}，发布于 ${formatReleaseTime(release.published_at)}，${countText}`}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [aboutStyles.releaseHead, (pressed || open) && { backgroundColor: p.pressed }]}
      >
        <View style={[aboutStyles.timelineDot, { backgroundColor: current ? p.accent : p.textTertiary }]} />
        <Text numberOfLines={1} style={[aboutStyles.timelineTag, { color: current ? p.text : p.textSecondary }]}>
          {release.tag}
        </Text>
        <Text style={[aboutStyles.timelineTime, { color: p.textTertiary }]}>
          {formatReleaseShort(release.published_at)}
        </Text>
        <Text numberOfLines={1} style={[aboutStyles.releaseCount, { color: p.textTertiary }]}>
          {countText}
        </Text>
        {current ? (
          <View style={[aboutStyles.currentBadge, { backgroundColor: p.tile }]}>
            <Text style={[aboutStyles.currentBadgeText, { color: p.textSecondary }]}>当前</Text>
          </View>
        ) : null}
        {open ? (
          <ChevronUp size={14} color={p.textTertiary} strokeWidth={2} />
        ) : (
          <ChevronDown size={14} color={p.textTertiary} strokeWidth={2} />
        )}
      </Pressable>
      {open ? (
        <View style={[aboutStyles.releaseBody, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.separator }]}>
          {(['feature', 'fix', 'other'] as const).map((type) => {
            const items = notes.filter((note) => note.type === type);
            if (!items.length) return null;
            const label = type === 'feature' ? '新功能' : type === 'fix' ? '修复' : '其他';
            return (
              <View key={type} style={aboutStyles.noteGroup}>
                <Text style={[aboutStyles.noteCat, { color: p.textSecondary }]}>
                  {label} · {items.length}
                </Text>
                {items.map((note, index) => (
                  <View key={`${note.commit}-${index}`} style={aboutStyles.noteRow}>
                    <Text numberOfLines={2} style={[aboutStyles.noteTitle, { color: p.text }]}>
                      {note.title}
                    </Text>
                    {note.commit ? (
                      <Text style={[aboutStyles.noteCommit, { color: p.textTertiary }]}>{note.commit}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            );
          })}
          {!notes.length ? (
            <Text style={[aboutStyles.timelineTime, { color: p.textTertiary }]}>无变更记录</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
