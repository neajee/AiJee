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
  return <div className={""}>
      <div className={"" + " " + ""}>
        <div className={"" + " " + ""}>
          <div className={""}>
            <span className={"" + " " + ""}>
              {title}
            </span>
            {request.message ? <span className={"" + " " + ""}>
                {request.message}
              </span> : null}
            {timeoutText ? <span className={"" + " " + ""}>
                {timeoutText}
              </span> : null}
          </div>

          <button onClick={handleCancel} disabled={mutation.isPending} role="button" aria-label="Dismiss question">
            <X size={16} color={theme.textMuted} strokeWidth={1.8} />
          </button>
        </div>

        {request.method === "select" && <div className={""} keyboardShouldPersistTaps="handled">
            {request.options.map(option => {
          const isSelected = selectedOption === option;
          return <button key={`${request.id}-${option}`} onClick={() => setSelectedOption(option)}>
                  {isSelected ? <CircleDot size={16} color={theme.accentColor} strokeWidth={1.8} /> : <Circle size={16} color={theme.textMuted} strokeWidth={1.8} />}
                  <span className={"" + " " + ""}>
                    {option}
                  </span>
                </button>;
        })}
          </div>}

        {request.method === "confirm" && <div className={""}>
            <div className={""}>
              <button onClick={() => submit({
            confirmed: false
          })} disabled={mutation.isPending} className={"" + " " + ""}>
                <span className={"" + " " + ""}>
                  No
                </span>
              </button>
              <button onClick={() => submit({
            confirmed: true
          })} disabled={mutation.isPending} className={"" + " " + ""}>
                <Check size={14} color={theme.colors.background} strokeWidth={2} />
                <span className={"" + " " + ""}>
                  Yes
                </span>
              </button>
            </div>
          </div>}

        {request.method === "input" && <div className={""}>
            <input value={draft} onChangeText={setDraft} placeholder={request.placeholder ?? "Type your response"} placeholderTextColor={theme.textMuted} className={"" + " " + ""} autoFocus autoCorrect={false} editable={!mutation.isPending} returnKeyType="done" onSubmitEditing={() => submit({
          value: draft
        })} />
          </div>}

        {request.method === "editor" && <div className={""}>
            <input value={draft} onChangeText={setDraft} placeholder="Edit the text" placeholderTextColor={theme.textMuted} className={"" + " " + ""} autoFocus multiline textAlignVertical="top" editable={!mutation.isPending} />
          </div>}

        {request.method !== "confirm" && <div className={"" + " " + ""}>
            <button onClick={handleCancel} disabled={mutation.isPending} className={"" + " " + ""}>
              <span className={"" + " " + ""}>
                Cancel
              </span>
            </button>
            <button onClick={() => submit({
          value: request.method === "select" ? selectedOption : draft
        })} disabled={mutation.isPending || !canSubmitSelect} className={"" + " " + "opacity-[null]"}>
              {mutation.isPending ? <span size="small" color={theme.colors.background} /> : <span className={"" + " " + ""}>
                  Submit
                </span>}
            </button>
          </div>}

        {mutation.isError && <div className={""}>
            <span className={"" + " " + ""}>
              {mutation.error instanceof Error ? mutation.error.message : "Failed to send the response"}
            </span>
          </div>}
      </div>
    </div>;
}
