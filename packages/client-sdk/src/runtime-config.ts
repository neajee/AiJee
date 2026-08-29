import { client } from "./generated/client.gen";
import { sameOriginBaseUrl, type RuntimeLocation } from "./utils/runtime-base-url";

const location = (globalThis as typeof globalThis & { location?: RuntimeLocation }).location;
const baseUrl = sameOriginBaseUrl(location);
if (baseUrl) client.setConfig({ baseUrl });

export { client };
