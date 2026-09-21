import type { ModelSectionProps } from './component-types';
export function ModelSection({
  title,
  children
}: ModelSectionProps) {
  return <div className="flex flex-col gap-2">
      <span className="pl-[var(--header-inset)] pr-[var(--header-inset)] text-left text-caption font-medium text-text-secondary">{title}</span>
      <div className="overflow-hidden rounded-[var(--card-radius)]">
        {children}
      </div>
    </div>;
}
