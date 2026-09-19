import { Text } from "@/platform/dom";

export default function MaterialIcons({ name, size = 24, color = "currentColor" }: { name?: string; size?: number; color?: string }) {
  return <Text style={{ fontSize: size, color }}>{name === "close" ? "×" : "•"}</Text>;
}
