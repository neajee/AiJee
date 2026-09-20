export function IconButton({
  onPress,
  title,
  icon,
  disabled,
  style
}: {
  onPress: () => void;
  title: string;
  icon: React.ReactNode;
  disabled?: boolean;
  style?: any;
}) {
  return <button onClick={e => {
    e.stopPropagation?.();
    if (!disabled) onPress();
  }} disabled={disabled} aria-label={title} role="button" {...{
    title
  }}>
      {icon}
    </button>;
}
const styles = {
  iconButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center"
  }
} as const;
