import { memo, useCallback, useState } from "react";
import type { ToolResultImage } from "../../../component-types.ts";
interface ToolResultImagesProps {
  images: ToolResultImage[];
  isDark: boolean;
}
export const ToolResultImages = memo(function ToolResultImages({
  images
}: ToolResultImagesProps) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const openPreview = useCallback((uri: string) => setPreviewUri(uri), []);
  const closePreview = useCallback(() => setPreviewUri(null), []);
  if (!images.length) return null;
  return <>
      <div className="flex flex-col">
        {images.map((img, i) => {
        const uri = img.data.startsWith("data:") ? img.data : `data:${img.mimeType};base64,${img.data}`;
        return <button key={i} onClick={() => openPreview(uri)}>
              <img src={uri} className="max-w-full object-contain" />
            </button>;
      })}
      </div>
      {previewUri && <div>
          <button className="inline-flex items-center" onClick={closePreview}>
            <div className="flex flex-col">
              <img src={previewUri} className="max-w-full max-h-[80vh] object-contain" />
            </div>
          </button>
        </div>}
    </>;
});