import { Check, Circle, CircleDot, X } from "lucide-react";
import type { ExtensionUiController } from "../../hooks/use-extension-ui-controller";
export function ExtensionUiView({
  controller
}: {
  controller: ExtensionUiController;
}) {
  const {
    theme,
    mutation,
    request,
    selectedOption,
    setSelectedOption,
    draft,
    setDraft,
    title,
    timeoutText,
    submit,
    handleCancel,
    canSubmitSelect
  } = controller;
  if (!request) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-xl">
        <div>
          <div className="flex flex-col">
            <span className={"  text-foreground"}>
              {title}
            </span>
            {request.message ? <span className={"  text-text-secondary"}>
                {request.message}
              </span> : null}
            {timeoutText ? <span className={"  text-foreground"}>
                {timeoutText}
              </span> : null}
          </div>

          <button onClick={handleCancel} disabled={mutation.isPending} role="button" aria-label="Dismiss question">
            <X size={16} color={theme.textMuted} strokeWidth={1.8} />
          </button>
        </div>

        {request.method === "select" && <div className="flex flex-col">
            {request.options.map(option => {
          const isSelected = selectedOption === option;
          return <button key={`${request.id}-${option}`} onClick={() => setSelectedOption(option)}>
                  {isSelected ? <CircleDot size={16} color={theme.accentColor} strokeWidth={1.8} /> : <Circle size={16} color={theme.textMuted} strokeWidth={1.8} />}
                  <span className={"  text-foreground"}>
                    {option}
                  </span>
                </button>;
        })}
          </div>}

        {request.method === "confirm" && <div className="flex flex-col">
            <div className="flex flex-col">
              <button onClick={() => submit({
            confirmed: false
          })} disabled={mutation.isPending} className={"  border-border"}>
                <span className={"  text-foreground"}>
                  No
                </span>
              </button>
              <button onClick={() => submit({
            confirmed: true
          })} disabled={mutation.isPending} className={"  bg-foreground"}>
                <Check size={14} color={theme.colors.background} strokeWidth={2} />
                <span className={"  text-surface"}>
                  Yes
                </span>
              </button>
            </div>
          </div>}

        {request.method === "input" && <div className="flex flex-col">
            <input value={draft} onChange={event => setDraft(event.target.value)} placeholder={request.placeholder ?? "Type your response"} className="w-full rounded border border-border bg-card px-3 py-2 text-foreground" autoFocus disabled={mutation.isPending} onKeyDown={event => { if (event.key === "Enter") submit({ value: draft }); }} />
          </div>}

        {request.method === "editor" && <div className="flex flex-col">
            <textarea value={draft} onChange={event => setDraft(event.target.value)} placeholder="Edit the text" className="min-h-28 w-full rounded border border-border bg-card px-3 py-2 text-foreground" autoFocus disabled={mutation.isPending} />
          </div>}

        {request.method !== "confirm" && <div>
            <button onClick={handleCancel} disabled={mutation.isPending} className={"  border-border"}>
              <span className={"  text-foreground"}>
                Cancel
              </span>
            </button>
            <button onClick={() => submit({
          value: request.method === "select" ? selectedOption : draft
        })} disabled={mutation.isPending || !canSubmitSelect} className={"  bg-foreground opacity-100"}>
              {mutation.isPending ? <span className="size-3 animate-spin" /> : <span className={"  text-surface"}>
                  Submit
                </span>}
            </button>
          </div>}

        {mutation.isError && <div className="flex flex-col">
            <span className={"  text-destructive"}>
              {mutation.error instanceof Error ? mutation.error.message : "Failed to send the response"}
            </span>
          </div>}
      </div>
    </div>;
}
