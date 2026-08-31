import { usePathname } from 'expo-router';

export type AppMode = 'work' | 'code' | 'desktop';

export function useAppMode(): AppMode {
  const pathname = usePathname();
  if (pathname.startsWith('/desktop')) return 'desktop';
  if (pathname.startsWith('/work')) return 'work';
  return 'code';
}
