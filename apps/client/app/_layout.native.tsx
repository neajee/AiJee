import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootLayout from './_layout.tsx';

export default function NativeLayout() {
  return (
    <SafeAreaProvider>
      <RootLayout />
    </SafeAreaProvider>
  );
}
