import type { ReactNode } from 'react';
import type { CustomProvider } from '../../store/custom-models';
import type { useColors } from '../../hooks/use-custom-models-theme';

export type CustomModelsColors = ReturnType<typeof useColors>;

export interface ProviderMarkProps {
  name: string;
  id?: string;
  colors: CustomModelsColors;
}

export interface ModelSectionProps {
  title: string;
  children: ReactNode;
  colors: CustomModelsColors;
}

export interface RowDividerProps {
  colors: CustomModelsColors;
}

export interface ProviderRowProps {
  name: string;
  id?: string;
  meta?: string | null;
  connected?: boolean;
  colors: CustomModelsColors;
  onPress?: () => void;
  trailing?: ReactNode;
  disabled?: boolean;
}

export interface CustomProviderRowProps {
  name: string;
  provider: CustomProvider;
  colors: CustomModelsColors;
  onUpdate: (provider: CustomProvider) => void;
  onRemove: () => void;
}
