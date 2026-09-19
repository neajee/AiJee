import { toTailwind } from "@/styles/to-tailwind";
export default function MaterialIcons({
  name,
  size = 24,
  color = "currentColor"
}: {
  name?: string;
  size?: number;
  color?: string;
}) {
  return <span className={toTailwind({
    fontSize: size,
    color
  })}>{name === "close" ? "×" : "•"}</span>;
}
