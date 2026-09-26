import type { ChatInboxMetadataMap, ChatInboxResponse } from "@/types/chat-inbox";

const chatWebSocketBase =
    (import.meta.env.VITE_CHAT_WS_URL as string | undefined) ?? "ws://localhost:8002";

const chatHttpBase = chatWebSocketBase
    .replace(/^wss:/i, "https:")
    .replace(/^ws:/i, "http:")
    .replace(/\/$/, "");

export const chatInboxApi = {
    getMetadata: async (token: string): Promise<ChatInboxMetadataMap> => {
        const endpoint = new URL(`${chatHttpBase}/inbox`);
        endpoint.searchParams.set("token", token);

        const response = await fetch(endpoint, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        let payload: ChatInboxResponse;

        try {
            payload = (await response.json()) as ChatInboxResponse;
        } catch {
            throw new Error("Chat activity is temporarily unavailable.");
        }

        if (!response.ok || !payload.success) {
            throw new Error("Chat activity is temporarily unavailable.");
        }

        return payload.data ?? {};
    },
};
