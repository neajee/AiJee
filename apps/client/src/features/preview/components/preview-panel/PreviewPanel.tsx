import { toTailwind } from "@/styles/to-tailwind";
import { memo } from "react";
import { Plus } from "lucide-react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { BrowserPreview } from "@/features/preview/components/browser-preview";
import { usePreviewPanelController } from "../../hooks/use-preview-panel-controller";
import { styles } from "./style-tokens";
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
    return <div className={toTailwind([styles.emptyState, {
      backgroundColor: isDark ? "#151515" : "#FAFAFA"
    }])}>
        <span className={toTailwind([styles.emptyTitle, {
        color: isDark ? "#F5F5F5" : "#1A1A1A"
      }])}>Preview</span>
        <span className={toTailwind([styles.emptyBody, {
        color: isDark ? "#8B8685" : "#6B6B6B"
      }])}>
          Open a session to preview running apps.
        </span>
      </div>;
  }
  if (targets.length === 0) {
    return <div className={toTailwind([styles.emptyState, {
      backgroundColor: isDark ? "#151515" : "#FAFAFA"
    }])}>
        <span className={toTailwind([styles.emptyTitle, {
        color: isDark ? "#F5F5F5" : "#1A1A1A"
      }])}>Preview</span>
        <span className={toTailwind([styles.emptyBody, {
        color: isDark ? "#8B8685" : "#6B6B6B"
      }])}>
          Add a port to preview a running app.
        </span>
        <div className={toTailwind(styles.addPortRow)}>
          <input className={toTailwind([styles.portInput, {
          color: isDark ? "#F5F5F5" : "#1A1A1A",
          backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
          borderColor: isDark ? "#3A3A3A" : "#D5D5D5"
        }])} placeholder="Port (e.g. 3000)" placeholderTextColor={isDark ? "#6B6B6B" : "#999"} value={portInput} onChangeText={setPortInput} keyboardType="number-pad" onSubmitEditing={handleAddPort} />
          <button onClick={handleAddPort} disabled={!portInput.trim()} className={toTailwind(({
          pressed
        }) => [styles.addPortBtn, {
          backgroundColor: isDark ? "#2B2A2A" : "#EDEDED",
          opacity: !portInput.trim() ? 0.4 : pressed ? 0.7 : 1
        }])}>
            <span className={toTailwind([styles.addPortBtnText, {
            color: isDark ? "#F5F5F5" : "#1A1A1A"
          }])}>
              Add
            </span>
          </button>
        </div>
        {suggestions.length > 0 && <div className={toTailwind(styles.suggestionsWrap)}>
            <span className={toTailwind([styles.suggestionsLabel, {
          color: isDark ? "#8B8685" : "#6B6B6B"
        }])}>
              Detected ports
            </span>
            <div className={toTailwind(styles.suggestionsRow)}>
              {suggestions.map(s => <button key={s.id} onClick={() => handleAddSuggestion(s)} className={toTailwind(({
            pressed
          }) => [styles.suggestionChip, {
            backgroundColor: isDark ? "#1E1E1E" : "#F2F2F2",
            borderColor: isDark ? "#3A3A3A" : "#E3E3E3"
          }, pressed && {
            opacity: 0.7
          }])}>
                  <span className={toTailwind([styles.suggestionChipText, {
              color: isDark ? "#B9B4B1" : "#555"
            }])}>
                    {s.label}
                  </span>
                </button>)}
            </div>
          </div>}
      </div>;
  }
  return <div className={toTailwind([styles.container, {
    backgroundColor: isDark ? "#151515" : "#FAFAFA"
  }])}>
      <div className={toTailwind([styles.toolbar, {
      borderBottomColor: isDark ? "#323131" : "rgba(0,0,0,0.08)"
    }])}>
        <span className={toTailwind([styles.title, {
        color: isDark ? "#F5F5F5" : "#1A1A1A"
      }])}>Preview</span>
        <div horizontal>
          {targets.map(target => {
          const active = selectedTarget?.id === target.id;
          return <button key={target.id} onClick={() => selectTarget(sessionId, target.id)} className={toTailwind(({
            pressed
          }) => [styles.targetChip, {
            backgroundColor: active ? isDark ? "#2B2A2A" : "#EDEDED" : isDark ? "#1B1B1B" : "#F2F2F2",
            borderColor: active ? isDark ? "#4A4848" : "#D5D5D5" : isDark ? "#2E2E2E" : "#E3E3E3"
          }, pressed && {
            opacity: 0.8
          }])}>
                <span className={toTailwind([styles.targetChipLabel, {
              color: active ? isDark ? "#F5F5F5" : "#1A1A1A" : isDark ? "#B9B4B1" : "#555555"
            }])}>
                  {target.label}
                </span>
              </button>;
        })}
          {showPortInput ? <div className={toTailwind(styles.inlinePortRow)}>
              <input autoFocus className={toTailwind([styles.inlinePortInput, {
            color: isDark ? "#F5F5F5" : "#1A1A1A",
            backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
            borderColor: isDark ? "#3A3A3A" : "#D5D5D5"
          }])} placeholder="Port" placeholderTextColor={isDark ? "#6B6B6B" : "#999"} value={portInput} onChangeText={setPortInput} keyboardType="number-pad" onSubmitEditing={handleAddPort} onBlur={() => {
            if (!portInput.trim()) setShowPortInput(false);
          }} />
            </div> : <button onClick={() => setShowPortInput(true)} className={toTailwind(({
          pressed
        }) => [styles.addChipBtn, {
          borderColor: isDark ? "#2E2E2E" : "#E3E3E3"
        }, pressed && {
          opacity: 0.7
        }])}>
              <Plus size={14} color={isDark ? "#8B8685" : "#999"} strokeWidth={1.8} />
            </button>}
        </div>
      </div>
      <div className={toTailwind(styles.content)}>
        {selectedTarget ? <BrowserPreview serverUrl={serverUrl} accessToken={accessToken} sessionId={sessionId} target={selectedTarget} /> : <div className={toTailwind(styles.loadingState)}>
            <span size="small" />
          </div>}
      </div>
    </div>;
}
export const PreviewPanel = memo(PreviewPanelComponent);
