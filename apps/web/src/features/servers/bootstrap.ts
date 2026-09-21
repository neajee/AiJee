import type { Server } from './store';

export type BootstrapTarget = { kind: 'same-origin'; server: Server } | { kind: 'remote' };

export async function getBootstrapTarget(): Promise<BootstrapTarget> {
  if (false || typeof window === 'undefined') {
    console.info('[aijee/bootstrap] remote: native runtime has no local server');
    return { kind: 'remote' };
  }
  const address = window.location.origin;
  try {
    const [health, version] = await Promise.all([
      fetch(`${address}/api/health`),
      fetch(`${address}/api/version`),
    ]);
    const payload = await version.json() as { remote?: boolean; data?: { remote?: boolean } };
    const remote = payload.data?.remote ?? payload.remote ?? false;
    console.info('[aijee/bootstrap] probe', { address, health: health.status, version: version.status, remote });
    // A UI served by this runtime is trusted as same-origin, whether it is
    // opened through loopback or a LAN address. Cross-origin API callers still
    // need a device code on the server.
    if (health.ok && version.ok) return { kind: 'same-origin', server: { id: 'local', name: '这台电脑', address } };
  } catch (error) {
    console.warn('[aijee/bootstrap] probe failed', { address, error: error instanceof Error ? error.message : String(error) });
  }
  console.info('[aijee/bootstrap] remote: same-origin runtime unavailable');
  return { kind: 'remote' };
}
