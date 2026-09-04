import { Stack } from 'expo-router';

import ScanConnectWebScreen from '../mobile/screens/scan-connect-web';

export default function MobilePreviewScanConnectRoute() {
  return <>
    <Stack.Screen options={{ headerShown: false }} />
    <ScanConnectWebScreen />
  </>;
}
