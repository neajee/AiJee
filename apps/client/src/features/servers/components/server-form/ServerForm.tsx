import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { ServerFormDesktopModal } from './desktop-modal';
import { ServerFormSheet } from './sheet';
import type { ServerFormProps } from './component-types';
export function ServerFormModal(props: ServerFormProps) {
  const {
    isWideScreen
  } = useResponsiveLayout();
  if (!props.visible) return null;
  return isWideScreen ? <ServerFormDesktopModal {...props} /> : <ServerFormSheet {...props} />;
}
export type { ServerFormData, ServerFormProps } from './component-types';
export { ServerFormFields } from './fields';
