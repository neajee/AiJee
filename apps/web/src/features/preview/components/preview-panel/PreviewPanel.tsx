import { memo } from "react";
import { Plus } from "lucide-react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { BrowserPreview } from "@/features/preview/components/browser-preview";
import { usePreviewPanelController } from "../../hooks/use-preview-panel-controller";
interface PreviewPanelProps {
  sessionId: string | null;
}
function PreviewPanelComponent({
  sessionId
}: PreviewPanelProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const controller = usePreviewPanelController(sessionId);
  const {
    serverUrl,
    accessToken,
    targets,
    suggestions,
    selectedTarget,
    selectTarget,
    portInput,
    setPortInput,
    showPortInput,
    setShowPortInput,
    handleAddPort,
    handleAddSuggestion
  } = controller;
  if (!sessionId) {
    return <div>
        <span>Preview</span>
        <span>
          Open a session to preview running apps.
        </span>
      </div>;
  }
  if (targets.length === 0) {
    return <div>
        <span>Preview</span>
        <span>
          Add a port to preview a running app.
        </span>
        <div className="flex flex-col">
          <input placeholder="Port (e.g. 3000)" value={portInput} onChange={event => setPortInput(event.target.value)} onKeyDown={event => event.key === "Enter" && handleAddPort(event)} />
          <button onClick={handleAddPort} disabled={!portInput.trim()} className="inline-flex items-center">
            <span>
              Add
            </span>
          </button>
        </div>
        {suggestions.length > 0 && <div className="flex flex-col">
            <span>
              Detected ports
            </span>
            <div className="flex flex-col">
              {suggestions.map(s => <button key={s.id} onClick={() => handleAddSuggestion(s)} className="inline-flex items-center">
                  <span>
                    {s.label}
                  </span>
                </button>)}
            </div>
          </div>}
      </div>;
  }
  return <div>
      <div>
        <span>Preview</span>
        <div horizontal>
          {targets.map(target => {
          const active = selectedTarget?.id === target.id;
          return <button key={target.id} onClick={() => selectTarget(sessionId, target.id)} className="inline-flex items-center">
                <span>
                  {target.label}
                </span>
              </button>;
        })}
          {showPortInput ? <div className="flex flex-col">
              <input autoFocus placeholder="Port" value={portInput} onChange={event => setPortInput(event.target.value)} onKeyDown={event => event.key === "Enter" && handleAddPort(event)} onBlur={() => {
            if (!portInput.trim()) setShowPortInput(false);
          }} />
            </div> : <button onClick={() => setShowPortInput(true)} className="inline-flex items-center">
              <Plus size={14} color={isDark ? "#8B8685" : "#999"} strokeWidth={1.8} />
            </button>}
        </div>
      </div>
      <div className="flex flex-col">
        {selectedTarget ? <BrowserPreview serverUrl={serverUrl} accessToken={accessToken} sessionId={sessionId} target={selectedTarget} /> : <div className="flex flex-col">
            <span className="size-3 animate-spin" />
          </div>}
      </div>
    </div>;
}
export const PreviewPanel = memo(PreviewPanelComponent);
