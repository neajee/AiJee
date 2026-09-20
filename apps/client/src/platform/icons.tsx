export default function MaterialIcons({
  name,
  size = 24,
  color = "currentColor"
}: {
  name?: string;
  size?: number;
  color?: string;
}) {
  return <span className={"text-[0]"}>{name === "close" ? "×" : "•"}</span>;
}
