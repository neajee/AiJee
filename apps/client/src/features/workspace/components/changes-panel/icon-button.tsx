export function IconButton({
  onClick,
  title,
  icon,
  disabled,
  style
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  disabled?: boolean;
  style?: any;
}) {
  return <button onClick={e => {
    e.stopPropagation?.();
    if (!disabled) onClick();
  }} disabled={disabled} aria-label={title} role="button" {...{
    title
  }}>
      {icon}
    </button>;
}