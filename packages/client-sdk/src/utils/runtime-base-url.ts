export type RuntimeLocation = { origin?: string; protocol?: string };

export function sameOriginBaseUrl(location?: RuntimeLocation): string | undefined {
  if (!location?.origin || !new Set(["http:", "https:"]).has(location.protocol ?? "")) return undefined;
  return location.origin.replace(/\/$/, "");
}
