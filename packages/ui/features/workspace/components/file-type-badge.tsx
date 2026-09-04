import { Text, View } from 'tamagui';


import { Fonts } from "@/constants/theme";

/**
 * A file's kind, spelled out in two or three letters.
 *
 * A row of identical page glyphs says nothing, and a saturated icon per file
 * fights the filename for attention. Letters read at a glance, cost one Text,
 * and stay legible at 9px where a drawn icon turns to mush.
 */
const TYPES: Record<string, { label: string; color: string }> = {
  ts: { label: "TS", color: "#4E8FD1" },
  tsx: { label: "TS", color: "#4E8FD1" },
  js: { label: "JS", color: "#C4A000" },
  jsx: { label: "JS", color: "#C4A000" },
  mjs: { label: "JS", color: "#C4A000" },
  cjs: { label: "JS", color: "#C4A000" },
  json: { label: "{}", color: "#B58900" },
  md: { label: "MD", color: "#8E8B89" },
  mdx: { label: "MD", color: "#8E8B89" },
  rs: { label: "RS", color: "#CE7A50" },
  py: { label: "PY", color: "#4B8BBE" },
  go: { label: "GO", color: "#4EA0B8" },
  css: { label: "CSS", color: "#5AA9D6" },
  scss: { label: "CSS", color: "#C2649B" },
  html: { label: "HT", color: "#CE7A50" },
  sh: { label: "SH", color: "#7EA96A" },
  yml: { label: "YML", color: "#8E8B89" },
  yaml: { label: "YML", color: "#8E8B89" },
  toml: { label: "TML", color: "#8E8B89" },
  lock: { label: "LCK", color: "#6f6b69" },
  svg: { label: "SVG", color: "#B07AB0" },
  png: { label: "IMG", color: "#B07AB0" },
  jpg: { label: "IMG", color: "#B07AB0" },
  jpeg: { label: "IMG", color: "#B07AB0" },
  gif: { label: "IMG", color: "#B07AB0" },
  webp: { label: "IMG", color: "#B07AB0" },
};

export function FileTypeBadge({
  path,
  fallbackColor,
}: {
  path: string;
  fallbackColor: string;
}) {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const known = TYPES[ext];
  // An unknown extension still identifies itself; a dot stands in for none.
  const label = known?.label ?? (ext ? ext.slice(0, 3).toUpperCase() : "·");

  return (
    <View style={styles.badge}>
      <Text style={[styles.label, { color: known?.color ?? fallbackColor }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = {
  badge: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 9,
    lineHeight: 12,
    fontFamily: Fonts.mono,
    letterSpacing: -0.3,
  },
} as const;
