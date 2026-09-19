import { useCallback, useEffect, useMemo, useState } from "react";
import { usePiClient } from "@aijee/client-sdk";
import { usePromptTheme } from "@/components/surface-theme/use-prompt-theme";
import type { PendingExtensionUiRequest } from "../extension-ui";
import { useAgentStore } from "../store";

function useSendExtensionUiResponse() {
  const client = usePiClient();
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mutate = useCallback(async (params: { sessionId: string; id: string; value?: unknown; confirmed?: boolean; cancelled?: boolean }) => {
    setIsPending(true);
    setIsError(false);
    setError(null);
    try {
      await client.sendExtensionUiResponse({ sessionId: params.sessionId, id: params.id, value: params.value as string | undefined, confirmed: params.confirmed, cancelled: params.cancelled });
      useAgentStore.getState().setPendingExtensionUiRequest(params.sessionId, null);
    } catch (cause: any) {
      setIsError(true);
      setError(cause instanceof Error ? cause : new Error(cause?.message ?? "Failed"));
    } finally {
      setIsPending(false);
    }
  }, [client]);
  return { mutate, isPending, isError, error };
}

function getRequestTitle(request: PendingExtensionUiRequest): string {
  if (request.title?.trim()) return request.title;
  switch (request.method) {
    case "select": return "Choose an Option";
    case "confirm": return "Confirm";
    case "input": return "Enter a Value";
    case "editor": return "Edit Text";
  }
}

function formatTimeout(timeout?: number): string | null {
  if (!timeout || timeout <= 0) return null;
  const seconds = Math.ceil(timeout / 1000);
  return `Waiting for a response${seconds > 0 ? ` (${seconds}s timeout)` : ""}`;
}

export function useExtensionUiController({ sessionId, request }: { sessionId?: string | null; request?: PendingExtensionUiRequest | null }) {
  const theme = usePromptTheme();
  const mutation = useSendExtensionUiResponse();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!request) {
      setSelectedOption(null);
      setDraft("");
    } else if (request.method === "select") {
      setSelectedOption(request.options[0] ?? null);
      setDraft("");
    } else if (request.method === "editor") {
      setDraft(request.prefill ?? "");
      setSelectedOption(null);
    } else if (request.method === "input") {
      setDraft(request.value ?? "");
      setSelectedOption(null);
    } else {
      setSelectedOption(null);
      setDraft("");
    }
  }, [request]);

  const title = useMemo(() => request ? getRequestTitle(request) : "", [request]);
  const timeoutText = useMemo(() => request ? formatTimeout(request.timeout) : null, [request]);
  const submit = useCallback((payload: { value?: unknown; confirmed?: boolean; cancelled?: boolean }) => {
    if (mutation.isPending || !sessionId || !request) return;
    mutation.mutate({ sessionId, id: request.id, ...payload });
  }, [mutation, request, sessionId]);
  const handleCancel = useCallback(() => submit({ cancelled: true }), [submit]);
  const canSubmitSelect = !request || request.method !== "select" || selectedOption !== null;

  return { theme, mutation, request, sessionId, selectedOption, setSelectedOption, draft, setDraft, title, timeoutText, submit, handleCancel, canSubmitSelect };
}

export type ExtensionUiController = ReturnType<typeof useExtensionUiController>;
