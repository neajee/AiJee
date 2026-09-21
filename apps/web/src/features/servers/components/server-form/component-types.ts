import type { Server } from '@/features/servers/store';

export type ServerFormData = Omit<Server, 'id'>;

export interface ServerFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ServerFormData) => void;
  initial?: Server;
  isDark: boolean;
  loading?: boolean;
  error?: string | null;
}
