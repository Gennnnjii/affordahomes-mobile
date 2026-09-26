import { chatInboxApi } from "@/db/api/chat.api";
import { useQuery } from "@tanstack/react-query";

type ChatInboxRole = "client" | "agent";

export const useChatInboxMetadata = (role: ChatInboxRole, token: string | null) =>
    useQuery({
        queryKey: [role, "chat", "inbox"],
        queryFn: () => {
            if (!token) {
                throw new Error("Chat authentication is unavailable.");
            }

            return chatInboxApi.getMetadata(token);
        },
        enabled: Boolean(token),
        retry: 1,
    });
