import { memo, useCallback, useState } from "react";
import type { ToolResultImage } from "../agent-types";
interface ToolResultImagesProps {
  images: ToolResultImage[];
  isDark: boolean;
}
export const ToolResultImages = memo(function ToolResultImages({
  images,
  isDark
}: ToolResultImagesProps) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const openPreview = useCallback((uri: string) => setPreviewUri(uri), []);
  const closePreview = useCallback(() => setPreviewUri(null), []);
  if (!images.length) return null;
  return <>
      <div className={"block"}>
        {images.map((img, i) => {
        const uri = img.data.startsWith("data:") ? img.data : `data:${img.mimeType};base64,${img.data}`;
        return <button key={i} onClick={() => openPreview(uri)}>
              <img src={{
            uri
          }} className={"block"} resizeMode="contain" />
            </button>;
      })}
      </div>
      {previewUri && <div visible transparent animationType="fade" onRequestClose={closePreview}>
          <button className={"block"} onClick={closePreview}>
            <div className={"block"}>
              <img src={{
            uri: previewUri
          }} className={"block"} resizeMode="contain" />
            </div>
          </button>
        </div>}
    </>;
});
const styles = {
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    marginLeft: 12
  },
  thumbWrap: {
    borderRadius: 8,
    overflow: "hidden",
    maxWidth: 400,
    maxHeight: 300
  },
  thumb: {
    width: 320,
    height: 200,
    ...(true ? {
      maxWidth: "100%" as const
    } : {})
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center"
  },
  previewWrap: {
    width: "90%",
    height: "80%",
    alignItems: "center",
    justifyContent: "center"
  },
  previewImage: {
    width: "100%",
    height: "100%"
  }
} as const;
