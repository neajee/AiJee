export const PIDECK_API_PREFIX = "/api";
export const PIDECK_STREAM_PATH = `${PIDECK_API_PREFIX}/stream`;
export const PIDECK_DEFAULT_PORT = 5454;

export interface PideckServerRef {
  id: string;
  name: string;
  url: string;
  platform?: string;
  lastSeenAt?: number;
}

export interface PideckPairingPayload {
  serverId: string;
  qrId: string;
  address: string;
}

export interface PideckStreamCursor {
  from?: number;
  sessionId?: string;
}
