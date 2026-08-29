import type { ImageAttachment } from "@pideck/engine";

/** Anything larger is a mistake, not an attachment: 12MB of base64 per image. */
const MAX_IMAGE_BASE64_BYTES = 12 * 1024 * 1024;

const DATA_URL = /^data:([^;,]+)(?:;[^,]*)?,/;

/**
 * Validates the `images` field of a prompt request into engine attachments.
 *
 * The clients post base64 payloads, but a hand-written request (or an older
 * client) may send a whole data URL, so the prefix is accepted and stripped
 * rather than passed to the model as if it were image bytes. Anything that is
 * not a usable image is dropped instead of failing the prompt: losing an
 * attachment is recoverable, losing the message is not.
 */
export function normalizeImageAttachments(input: unknown): ImageAttachment[] | undefined {
  if (!Array.isArray(input) || input.length === 0) return undefined;

  const images: ImageAttachment[] = [];
  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as { data?: unknown; mimeType?: unknown; mime_type?: unknown };
    if (typeof candidate.data !== "string" || candidate.data.length === 0) {
      throw new Error("Invalid image attachment");
    }

    let data = candidate.data.trim();
    let mimeType =
      typeof candidate.mimeType === "string"
        ? candidate.mimeType
        : typeof candidate.mime_type === "string"
          ? candidate.mime_type
          : "";

    const dataUrl = DATA_URL.exec(data);
    if (dataUrl) {
      mimeType = mimeType || dataUrl[1]!;
      data = data.slice(dataUrl[0].length);
    }
    // Some clients wrap base64 at 76 columns; the SDK wants one flat string.
    data = data.replace(/\s+/g, "");
    if (!data || data.length > MAX_IMAGE_BASE64_BYTES || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
      throw new Error("Invalid image attachment data");
    }
    if (!mimeType.startsWith("image/")) throw new Error("Invalid image MIME type");

    images.push({ type: "image", data, mimeType });
  }

  return images.length > 0 ? images : undefined;
}
