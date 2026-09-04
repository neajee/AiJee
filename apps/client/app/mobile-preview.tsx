import { Stack } from 'expo-router';

import MobileServersScreen from '../mobile/screens/servers';

export default function MobilePreviewRoute() {
  return <>
    <Stack.Screen options={{ headerShown: false }} />
    <MobileServersScreen />
  </>;
}
