import { useRef } from "react";

export const RecordingPresets = { HIGH_QUALITY: {} };
export const AudioModule = { requestRecordingPermissionsAsync: async () => ({ granted: false }) };
export async function setAudioModeAsync(_options?: unknown): Promise<void> {}
export function useAudioRecorder(_options?: unknown) {
  const ref = useRef({ uri: undefined as string | undefined, prepareToRecordAsync: async () => {}, record: () => {}, stop: async () => {} });
  return ref.current;
}
export function useAudioRecorderState(_recorder: unknown, _interval?: number) { return { metering: null as number | null }; }
