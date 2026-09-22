import { FileIcon } from '@react-symbols/icons/utils';

export function FileTypeBadge({ path }: { path: string; fallbackColor?: string }) {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return <FileIcon fileName={name} autoAssign width={16} height={16} aria-hidden="true" />;
}
