import { usePathname } from 'expo-router';

export type AppMode = 'code' | 'desktop';

export function useAppMode(): AppMode {
  const pathname = usePathname();
  if (pathname.startsWith('/desktop')) return 'desktop';
  return 'code';
}
