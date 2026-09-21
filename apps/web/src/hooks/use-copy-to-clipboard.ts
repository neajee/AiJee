import { useCallback, useEffect, useRef, useState } from "react";
import * as Clipboard from "@/platform/clipboard";

export type CopyStatus = "idle" | "copied" | "error";

/**
 * Copy text to the clipboard while surfacing success/failure to the caller.
 *
 * `navigator.clipboard` rejects on insecure origins (e.g. plain HTTP on a LAN
 * address) or when the document is not focused, and the platform helper can
 * throw. Those failures used to become unhandled rejections with no feedback,
 * so the button looked dead. Here they resolve to an `error` status the caller
 * can render, and the status resets to `idle` after `resetMs`.
 */
export function useCopyToClipboard(resetMs = 1500) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = useCallback(
    async (value: string | null | undefined): Promise<boolean> => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!value) {
        setStatus("error");
        timerRef.current = setTimeout(() => setStatus("idle"), resetMs);
        return false;
      }
      try {
        await Clipboard.setStringAsync(value);
        setStatus("copied");
        timerRef.current = setTimeout(() => setStatus("idle"), resetMs);
        return true;
      } catch {
        setStatus("error");
        timerRef.current = setTimeout(() => setStatus("idle"), resetMs);
        return false;
      }
    },
    [resetMs],
  );

  return { status, copy };
}
