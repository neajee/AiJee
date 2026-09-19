import { useEffect, useRef, useState } from "react";
import { normalizeStart } from "../utils/turns";

export function useTurnElapsed(active: boolean, startedAt: number): number {
  const mountedAt = useRef(Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return 0;
  return Math.max(0, now - normalizeStart(startedAt, mountedAt.current));
}
