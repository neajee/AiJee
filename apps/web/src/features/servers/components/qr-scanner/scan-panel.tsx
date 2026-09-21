import { QrCode } from "lucide-react";
export function QrScannerScanPanel() {
  return <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-raised p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background">
        <QrCode size={20} className="text-text-tertiary" strokeWidth={1.8} />
      </div>
      <p className="text-caption leading-5 text-text-secondary">
        Camera scanning is not available on the web client. Paste the connect
        URL manually.
      </p>
    </div>;
}
