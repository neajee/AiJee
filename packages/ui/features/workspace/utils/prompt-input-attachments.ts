import type { ImageContent } from "@aijee/client-sdk";
import type { Attachment } from "./prompt-input";

/**
 * The base64 image blocks a draft's attachments carry, ready for `prompt`.
 *
 * Attachments hold their bytes as a data URL (that is what both the web file
 * reader and the native picker produce), while the agent API wants the payload
 * and the mime type apart. Attachments without bytes are skipped: an image the
 * model cannot see is better dropped than sent as an empty block.
 */
export function attachmentsToImages(
  attachments: Attachment[],
): ImageContent[] | undefined {
  const images: ImageContent[] = [];

  for (const attachment of attachments) {
    if (attachment.type !== "image" || !attachment.preview) continue;
    const dataUrl = attachment.preview;
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex < 0) {
      // Already a bare payload; the mime type is unknown, so assume PNG.
      images.push({ type: "image", data: dataUrl, mimeType: "image/png" });
      continue;
    }
    const mimeType = /data:([^;]+)/.exec(dataUrl.slice(0, commaIndex))?.[1] ?? "image/png";
    images.push({ type: "image", data: dataUrl.slice(commaIndex + 1), mimeType });
  }

  return images.length > 0 ? images : undefined;
}
