import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { History } from "lucide-react-native";

import { Fonts } from "@/constants/theme";
import { timeAgo } from "./constants";
import { useChangesTheme } from "./use-theme-colors";

interface LogEntry {
  hash: string;
  short_hash: string;
  author: string;
  date: string;
  message: string;
}

/** Where the spine sits, and how far down a row its dot lands. */
const SPINE_COLUMN = 18;
const SPINE_X = 7;
const DOT_SIZE = 5;
const DOT_TOP = 11;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

/**
 * Which pile a commit belongs to, coarsening as it recedes.
 *
 * Same buckets bolt uses for its chat history: the recent past is worth naming
 * by day, everything older only by month.
 */
function dateBin(date: Date, now: Date): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return WEEKDAYS[date.getDay()];
  if (days <= 30) return "Past 30 Days";
  if (date.getFullYear() === now.getFullYear()) return MONTHS[date.getMonth()];
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function binEntries(entries: LogEntry[]) {
  const now = new Date();
  const bins: { label: string; entries: LogEntry[] }[] = [];
  for (const entry of entries) {
    const label = dateBin(new Date(entry.date), now);
    const last = bins[bins.length - 1];
    if (last && last.label === label) last.entries.push(entry);
    else bins.push({ label, entries: [entry] });
  }
  return bins;
}

/**
 * The commit log as a timeline.
 *
 * Rows carry a spine with a dot per commit instead of hairline separators: the
 * separators made every commit look like a list item of equal weight, while the
 * spine says at a glance that this is history running downwards. The author is
 * only repeated when it changes.
 */
export function HistoryTab({ entries }: { entries: LogEntry[] }) {
  const { textPrimary, textSecondary, textMuted, dividerColor, hashColor } =
    useChangesTheme();

  const bins = useMemo(() => binEntries(entries), [entries]);

  if (entries.length === 0) {
    return (
      <View style={styles.cleanState}>
        <History size={20} color={textMuted} strokeWidth={2} />
        <Text style={[styles.emptyText, { color: textMuted }]}>
          No commits yet
        </Text>
      </View>
    );
  }

  return (
    <>
      {bins.map((bin) => (
        <View key={bin.label}>
          <Text style={[styles.binLabel, { color: textMuted }]}>
            {bin.label}
          </Text>
          {bin.entries.map((entry, i) => {
            const previous = i > 0 ? bin.entries[i - 1] : null;
            const showAuthor = !previous || previous.author !== entry.author;
            return (
              <View key={entry.hash} style={styles.logEntry}>
                <View style={styles.spine}>
                  {i > 0 && (
                    <View
                      style={[
                        styles.spineLineTop,
                        { backgroundColor: dividerColor },
                      ]}
                    />
                  )}
                  {i < bin.entries.length - 1 && (
                    <View
                      style={[
                        styles.spineLineBottom,
                        { backgroundColor: dividerColor },
                      ]}
                    />
                  )}
                  <View style={[styles.dot, { backgroundColor: hashColor }]} />
                </View>

                <View style={styles.logBody}>
                  <Text
                    style={[styles.logMessage, { color: textPrimary }]}
                    numberOfLines={1}
                  >
                    {entry.message}
                  </Text>
                  <View style={styles.logMeta}>
                    <Text style={[styles.logHash, { color: hashColor }]}>
                      {entry.short_hash}
                    </Text>
                    {showAuthor && (
                      <Text
                        style={[styles.logAuthor, { color: textSecondary }]}
                        numberOfLines={1}
                      >
                        {entry.author}
                      </Text>
                    )}
                    <View style={{ flex: 1 }} />
                    <Text style={[styles.logDate, { color: textMuted }]}>
                      {timeAgo(entry.date)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  cleanState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    textAlign: "center",
  },
  binLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  logEntry: {
    flexDirection: "row",
    paddingRight: 12,
    paddingLeft: 6,
  },
  spine: {
    width: SPINE_COLUMN,
  },
  spineLineTop: {
    position: "absolute",
    left: SPINE_X,
    top: 0,
    height: DOT_TOP,
    width: 1,
  },
  spineLineBottom: {
    position: "absolute",
    left: SPINE_X,
    top: DOT_TOP,
    bottom: 0,
    width: 1,
  },
  dot: {
    position: "absolute",
    left: SPINE_X - (DOT_SIZE - 1) / 2,
    top: DOT_TOP - DOT_SIZE / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  logBody: {
    flex: 1,
    paddingVertical: 5,
  },
  logMessage: {
    fontSize: 12.5,
    fontFamily: Fonts.sans,
    lineHeight: 18,
  },
  logMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  logHash: {
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  logAuthor: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    flexShrink: 1,
  },
  logDate: {
    fontSize: 11,
    fontFamily: Fonts.sans,
  },
});
