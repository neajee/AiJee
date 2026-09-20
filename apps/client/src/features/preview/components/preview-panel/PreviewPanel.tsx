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
    return <div className={"" + " " + ""}>
        <span className={"" + " " + ""}>Preview</span>
        <span className={"" + " " + ""}>
          Open a session to preview running apps.
        </span>
      </div>;
  }
  if (targets.length === 0) {
    return <div className={"" + " " + ""}>
        <span className={"" + " " + ""}>Preview</span>
        <span className={"" + " " + ""}>
          Add a port to preview a running app.
        </span>
        <div className={""}>
          <input className={"" + " " + ""} placeholder="Port (e.g. 3000)" placeholderTextColor={isDark ? "#6B6B6B" : "#999"} value={portInput} onChangeText={setPortInput} keyboardType="number-pad" onSubmitEditing={handleAddPort} />
          <button onClick={handleAddPort} disabled={!portInput.trim()} className={""}>
            <span className={"" + " " + ""}>
              Add
            </span>
          </button>
        </div>
        {suggestions.length > 0 && <div className={""}>
            <span className={"" + " " + ""}>
              Detected ports
            </span>
            <div className={""}>
              {suggestions.map(s => <button key={s.id} onClick={() => handleAddSuggestion(s)} className={""}>
                  <span className={"" + " " + ""}>
                    {s.label}
                  </span>
                </button>)}
            </div>
          </div>}
      </div>;
  }
  return <div className={"" + " " + ""}>
      <div className={"" + " " + ""}>
        <span className={"" + " " + ""}>Preview</span>
        <div horizontal>
          {targets.map(target => {
          const active = selectedTarget?.id === target.id;
          return <button key={target.id} onClick={() => selectTarget(sessionId, target.id)} className={""}>
                <span className={"" + " " + ""}>
                  {target.label}
                </span>
              </button>;
        })}
          {showPortInput ? <div className={""}>
              <input autoFocus className={"" + " " + ""} placeholder="Port" placeholderTextColor={isDark ? "#6B6B6B" : "#999"} value={portInput} onChangeText={setPortInput} keyboardType="number-pad" onSubmitEditing={handleAddPort} onBlur={() => {
            if (!portInput.trim()) setShowPortInput(false);
          }} />
            </div> : <button onClick={() => setShowPortInput(true)} className={""}>
              <Plus size={14} color={isDark ? "#8B8685" : "#999"} strokeWidth={1.8} />
            </button>}
        </div>
      </div>
      <div className={""}>
        {selectedTarget ? <BrowserPreview serverUrl={serverUrl} accessToken={accessToken} sessionId={sessionId} target={selectedTarget} /> : <div className={""}>
            <span size="small" />
          </div>}
      </div>
    </div>;
}
export const PreviewPanel = memo(PreviewPanelComponent);
