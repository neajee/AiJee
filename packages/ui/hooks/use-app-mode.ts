import { usePathname } from 'expo-router';

export type AppMode = 'work' | 'code';

export function useAppMode(): AppMode {
  const pathname = usePathname();
  if (pathname.startsWith('/work')) return 'work';
  return 'code';
}
