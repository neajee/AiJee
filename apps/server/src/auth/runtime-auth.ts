import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { RuntimeIdentity } from "../storage/state-store.ts";

export type DeviceRecord = {
  device_id: string;
  name: string;
  created_at: string;
  last_seen: string;
  revoked_at?: string;
};

type DeviceToken = { device_id: string; iat: number };
export type DeviceCode = { code: string; used: boolean };

export class RuntimeAuth {
  private readonly runtimeSecret: string;
  private readonly devices: Map<string, DeviceRecord>;
  private readonly persist: (runtimeSecret: string, devices: DeviceRecord[], codes: DeviceCode[]) => Promise<void>;
  private readonly codes = new Map<string, DeviceCode>();
  private pendingWrite: Promise<void> = Promise.resolve();

  constructor(
    runtimeSecret: string,
    devices: DeviceRecord[] = [],
    persist: (runtimeSecret: string, devices: DeviceRecord[], codes: DeviceCode[]) => Promise<void>,
    legacyIdentity?: RuntimeIdentity,
    codes: DeviceCode[] = [],
  ) {
    this.runtimeSecret = runtimeSecret || legacyIdentity?.signing_secret || randomBytes(32).toString("base64url");
    this.persist = persist;
    this.devices = new Map(devices.filter((device) => device?.device_id).map((device) => [device.device_id, device]));
    this.codes = new Map(codes.filter((value) => value?.code && !value.used).map((value) => [value.code, value]));
  }

  initialized(): boolean { return this.devices.size > 0; }
  snapshot(): DeviceRecord[] { return [...this.devices.values()]; }
  codeSnapshot(): DeviceCode[] { return [...this.codes.values()]; }
  secret(): string { return this.runtimeSecret; }

  issueDevice(name = "AiJee device"): Record<string, unknown> {
    const now = new Date().toISOString();
    const device: DeviceRecord = { device_id: randomUUID(), name: name.trim() || "AiJee device", created_at: now, last_seen: now };
    this.devices.set(device.device_id, device);
    this.schedulePersist();
    return { ...device, token: this.sign({ device_id: device.device_id, iat: Date.now() }) };
  }

  issueWithCode(code: string, name?: string): Record<string, unknown> {
    this.validateCode(code);
    return this.issueDevice(name);
  }

  revoke(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device || device.revoked_at) return false;
    device.revoked_at = new Date().toISOString();
    this.schedulePersist();
    return true;
  }

  list(): DeviceRecord[] { return this.snapshot().map(({ revoked_at: _revoked, ...device }) => device); }

  mintCode(): DeviceCode {
    const code = randomBytes(4).toString("hex").toUpperCase();
    const value = { code, used: false };
    this.codes.clear();
    this.codes.set(code, value);
    this.schedulePersist();
    return value;
  }

  currentCode(): DeviceCode {
    return [...this.codes.values()].at(-1) ?? this.mintCode();
  }

  validateCode(code: string): void {
    const value = this.codes.get(code);
    if (!value) throw new Error("Invalid device code");
  }

  authenticate(authorization?: string, cookie?: string): DeviceRecord | null {
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? this.cookieToken(cookie);
    if (!token) return null;
    try {
      const payload = this.verify(token);
      const device = this.devices.get(payload.device_id);
      if (!device || device.revoked_at) return null;
      device.last_seen = new Date().toISOString();
      return device;
    } catch { return null; }
  }

  validate(authorization?: string, cookie?: string): boolean { return !!this.authenticate(authorization, cookie); }
  tokenFor(deviceId: string): string | null {
    return this.devices.has(deviceId) ? this.sign({ device_id: deviceId, iat: Date.now() }) : null;
  }
  flush(): Promise<void> { return this.pendingWrite; }


  private cookieToken(cookie?: string): string | undefined {
    return cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("aijee_token="))?.slice("aijee_token=".length);
  }

  private schedulePersist(): void {
    this.pendingWrite = this.pendingWrite.then(() => this.persist(this.runtimeSecret, this.snapshot(), this.codeSnapshot()));
  }

  private sign(payload: DeviceToken): string {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${createHmac("sha256", this.runtimeSecret).update(encoded).digest("base64url")}`;
  }

  private verify(token: string): DeviceToken {
    const [encoded, signature] = token.split(".");
    const expected = createHmac("sha256", this.runtimeSecret).update(encoded).digest("base64url");
    if (!encoded || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("Invalid token");
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as DeviceToken;
    if (typeof payload.device_id !== "string" || typeof payload.iat !== "number") throw new Error("Invalid token");
    return payload;
  }
}
