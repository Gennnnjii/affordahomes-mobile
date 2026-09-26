import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
    id: string;
    sender_type: "agent" | "client";
    sender_id: string;
    sender_name: string;
    content: string;
    created_at: string;
}

export type ChatStatus = "connecting" | "connected" | "disconnected" | "error" | "reset";

export interface UseChatReturn {
    messages: ChatMessage[];
    send: (content: string) => void;
    status: ChatStatus;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const WS_BASE =
    (import.meta.env.VITE_CHAT_WS_URL as string | undefined) ?? "ws://localhost:8002";

export function useChat(
    inquiryId: string | null | undefined,
    token: string | null | undefined,
    onReset?: () => void,
): UseChatReturn {
    const connectionKey = inquiryId && token ? inquiryId : "";
    const [messageState, setMessageState] = useState<{
        connectionKey: string;
        messages: ChatMessage[];
    }>({ connectionKey: "", messages: [] });
    const [statusState, setStatusState] = useState<{
        connectionKey: string;
        status: ChatStatus;
    }>({ connectionKey: "", status: "disconnected" });
    const wsRef = useRef<WebSocket | null>(null);
    const onResetRef = useRef(onReset);
    const messages =
        messageState.connectionKey === connectionKey ? messageState.messages : [];
    const status = !connectionKey
        ? "disconnected"
        : statusState.connectionKey === connectionKey
          ? statusState.status
          : "connecting";

    useEffect(() => {
        onResetRef.current = onReset;
    }, [onReset]);

    useEffect(() => {
        if (!inquiryId || !token) {
            return;
        }

        // Guard against React StrictMode double-invoke: if cleanup runs before
        // the socket opens, mark it stale so handlers don't update state.
        let stale = false;
        let resetHandled = false;

        const handleReset = () => {
            if (stale || resetHandled) return;
            resetHandled = true;
            setMessageState({ connectionKey, messages: [] });
            setStatusState({ connectionKey, status: "reset" });
            wsRef.current = null;
            onResetRef.current?.();
        };

        const url = `${WS_BASE}/ws/${encodeURIComponent(inquiryId)}?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!stale) setStatusState({ connectionKey, status: "connected" });
        };

        ws.onmessage = (event: MessageEvent<string>) => {
            if (stale) return;
            try {
                const data = JSON.parse(event.data) as Record<string, unknown>;

                if (data.type === "chat_reset") {
                    handleReset();
                } else if (resetHandled) {
                    return;
                } else if (data.type === "history") {
                    setMessageState({
                        connectionKey,
                        messages: (data.messages as ChatMessage[]) ?? [],
                    });
                } else if (data.type === "message") {
                    const message = data as unknown as ChatMessage;
                    setMessageState((previous) => ({
                        connectionKey,
                        messages:
                            previous.connectionKey === connectionKey
                                ? [...previous.messages, message]
                                : [message],
                    }));
                } else if (data.type === "error") {
                    console.warn("[chat] server error:", data.content);
                    setStatusState({ connectionKey, status: "error" });
                }
            } catch {
                // ignore malformed frame
            }
        };

        ws.onerror = () => {
            if (!stale && !resetHandled) {
                setStatusState({ connectionKey, status: "error" });
            }
        };

        ws.onclose = (event) => {
            if (stale) return;
            if (event.code === 4004) {
                handleReset();
                return;
            }
            if (resetHandled) return;
            setStatusState({ connectionKey, status: "disconnected" });
            wsRef.current = null;
        };

        return () => {
            stale = true;
            if (wsRef.current === ws) wsRef.current = null;
            ws.close();
        };
    }, [connectionKey, inquiryId, token]);

    const send = useCallback((content: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ content }));
        }
    }, []);

    return { messages, send, status };
}
