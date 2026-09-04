import {  Platform  } from 'react-native';
import type { Server } from './store';

export type BootstrapTarget = { kind: 'local'; server: Server } | { kind: 'remote' };

export async function getBootstrapTarget(): Promise<BootstrapTarget> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    console.info('[aijee/bootstrap] remote: native runtime has no local server');
    return { kind: 'remote' };
  }
  const address = window.location.origin;
  const loopback = ["127.0.0.1", "localhost", "::1"].includes(window.location.hostname);
  try {
    const [health, version] = await Promise.all([
      fetch(`${address}/api/health`),
      fetch(`${address}/api/version`),
    ]);
    const payload = await version.json() as { remote?: boolean; data?: { remote?: boolean } };
    const local = loopback || payload.data?.remote === false || payload.remote === false;
    console.info('[aijee/bootstrap] probe', { address, health: health.status, version: version.status, local });
    if (health.ok && version.ok && local) return { kind: 'local', server: { id: 'local', name: '这台电脑', address } };
  } catch (error) {
    console.warn('[aijee/bootstrap] probe failed', { address, error: error instanceof Error ? error.message : String(error) });
  }
  console.info('[aijee/bootstrap] remote: same-origin runtime unavailable');
  return { kind: 'remote' };
}
