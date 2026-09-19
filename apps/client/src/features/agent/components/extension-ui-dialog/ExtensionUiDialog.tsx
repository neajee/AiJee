import { toTailwind } from "@/styles/to-tailwind";
import { Check, Circle, CircleDot, X } from "lucide-react";
import { styles } from "./style-tokens";
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
  return <div className={toTailwind(styles.wrapper)}>
      <div className={toTailwind([styles.container, {
      backgroundColor: theme.dropdownBg,
      borderColor: theme.dropdownBorder
    }])}>
        <div className={toTailwind([styles.header, {
        borderBottomColor: theme.dropdownBorder
      }])}>
          <div className={toTailwind(styles.headerText)}>
            <span className={toTailwind([styles.title, {
            color: theme.textPrimary
          }])}>
              {title}
            </span>
            {request.message ? <span className={toTailwind([styles.message, {
            color: theme.textMuted
          }])}>
                {request.message}
              </span> : null}
            {timeoutText ? <span className={toTailwind([styles.timeout, {
            color: theme.sectionColor
          }])}>
                {timeoutText}
              </span> : null}
          </div>

          <button onClick={handleCancel} disabled={mutation.isPending} role="button" aria-label="Dismiss question">
            <X size={16} color={theme.textMuted} strokeWidth={1.8} />
          </button>
        </div>

        {request.method === "select" && <div className={toTailwind(styles.scroll)} keyboardShouldPersistTaps="handled">
            {request.options.map(option => {
          const isSelected = selectedOption === option;
          return <button key={`${request.id}-${option}`} onClick={() => setSelectedOption(option)}>
                  {isSelected ? <CircleDot size={16} color={theme.accentColor} strokeWidth={1.8} /> : <Circle size={16} color={theme.textMuted} strokeWidth={1.8} />}
                  <span className={toTailwind([styles.optionText, {
              color: theme.textPrimary
            }])}>
                    {option}
                  </span>
                </button>;
        })}
          </div>}

        {request.method === "confirm" && <div className={toTailwind(styles.actionArea)}>
            <div className={toTailwind(styles.buttonRow)}>
              <button onClick={() => submit({
            confirmed: false
          })} disabled={mutation.isPending} className={toTailwind([styles.secondaryButton, {
            borderColor: theme.toolbarBorder
          }])}>
                <span className={toTailwind([styles.secondaryButtonText, {
              color: theme.textPrimary
            }])}>
                  No
                </span>
              </button>
              <button onClick={() => submit({
            confirmed: true
          })} disabled={mutation.isPending} className={toTailwind([styles.primaryButton, {
            backgroundColor: theme.colors.text
          }])}>
                <Check size={14} color={theme.colors.background} strokeWidth={2} />
                <span className={toTailwind([styles.primaryButtonText, {
              color: theme.colors.background
            }])}>
                  Yes
                </span>
              </button>
            </div>
          </div>}

        {request.method === "input" && <div className={toTailwind(styles.actionArea)}>
            <input value={draft} onChangeText={setDraft} placeholder={request.placeholder ?? "Type your response"} placeholderTextColor={theme.textMuted} className={toTailwind([styles.input, {
          color: theme.textPrimary,
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder
        }])} autoFocus autoCorrect={false} editable={!mutation.isPending} returnKeyType="done" onSubmitEditing={() => submit({
          value: draft
        })} />
          </div>}

        {request.method === "editor" && <div className={toTailwind(styles.actionArea)}>
            <input value={draft} onChangeText={setDraft} placeholder="Edit the text" placeholderTextColor={theme.textMuted} className={toTailwind([styles.editor, {
          color: theme.textPrimary,
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder
        }])} autoFocus multiline textAlignVertical="top" editable={!mutation.isPending} />
          </div>}

        {request.method !== "confirm" && <div className={toTailwind([styles.footer, {
        borderTopColor: theme.dropdownBorder
      }])}>
            <button onClick={handleCancel} disabled={mutation.isPending} className={toTailwind([styles.secondaryButton, {
          borderColor: theme.toolbarBorder
        }])}>
              <span className={toTailwind([styles.secondaryButtonText, {
            color: theme.textPrimary
          }])}>
                Cancel
              </span>
            </button>
            <button onClick={() => submit({
          value: request.method === "select" ? selectedOption : draft
        })} disabled={mutation.isPending || !canSubmitSelect} className={toTailwind([styles.primaryButton, {
          backgroundColor: theme.colors.text,
          opacity: mutation.isPending || !canSubmitSelect ? 0.45 : 1
        }])}>
              {mutation.isPending ? <span size="small" color={theme.colors.background} /> : <span className={toTailwind([styles.primaryButtonText, {
            color: theme.colors.background
          }])}>
                  Submit
                </span>}
            </button>
          </div>}

        {mutation.isError && <div className={toTailwind(styles.errorWrap)}>
            <span className={toTailwind([styles.errorText, {
          color: theme.colors.destructive
        }])}>
              {mutation.error instanceof Error ? mutation.error.message : "Failed to send the response"}
            </span>
          </div>}
      </div>
    </div>;
}
