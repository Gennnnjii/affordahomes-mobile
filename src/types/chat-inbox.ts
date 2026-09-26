export type ChatParticipantType = "agent" | "client";

export interface ChatInboxLastMessage {
    content: string;
    sender_type: ChatParticipantType;
    sender_id: string;
    sender_name: string;
    created_at: string;
}

export interface ChatInboxMetadata {
    inquiry_id: string;
    has_messages: boolean;
    last_message: ChatInboxLastMessage | null;
    last_activity_at: string | null;
}

export type ChatInboxMetadataMap = Record<string, ChatInboxMetadata>;

export interface ChatInboxResponse {
    success: boolean;
    data?: ChatInboxMetadataMap;
    message?: string;
    detail?: string;
}
