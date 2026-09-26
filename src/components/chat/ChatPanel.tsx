import { useChat, type ChatMessage } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, WifiOffIcon, LoaderIcon, MessageSquareIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

const timestampHasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i;

function parseChatTimestamp(timestamp: string): Date {
    const value = timestamp.trim();
    return new Date(timestampHasTimeZone.test(value) ? value : `${value}Z`);
}

function formatTime(iso: string): string {
    try {
        return parseChatTimestamp(iso).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
}

function smartDate(iso: string): string {
    try {
        const d = parseChatTimestamp(iso);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 86_400_000);
        const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (target.getTime() === today.getTime()) return "Today";
        if (target.getTime() === yesterday.getTime()) return "Yesterday";
        return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return "";
    }
}

// Consecutive messages from the same sender on the same date form one group
interface MessageGroup {
    senderId: string;
    senderName: string;
    isMine: boolean;
    date: string;
    items: ChatMessage[];
}

function buildGroups(messages: ChatMessage[], currentUserId: string): MessageGroup[] {
    const groups: MessageGroup[] = [];
    for (const msg of messages) {
        const date = smartDate(msg.created_at);
        const isMine = msg.sender_id === currentUserId;
        const last = groups[groups.length - 1];
        if (last && last.senderId === msg.sender_id && last.date === date) {
            last.items.push(msg);
        } else {
            groups.push({ senderId: msg.sender_id, senderName: msg.sender_name, isMine, date, items: [msg] });
        }
    }
    return groups;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const Avatar = ({ name, isMine }: { name: string; isMine: boolean }) => (
    <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
            isMine
                ? "bg-primary text-primary-foreground"
                : "bg-muted-foreground/15 text-muted-foreground"
        }`}
    >
        {initials(name) || "?"}
    </div>
);

// ─── Message group ────────────────────────────────────────────────────────────

const Group = ({ group }: { group: MessageGroup }) => (
    <div className={`flex gap-2 ${group.isMine ? "flex-row-reverse" : "flex-row"}`}>
        <div className="mt-0.5 shrink-0">
            <Avatar name={group.senderName} isMine={group.isMine} />
        </div>
        <div
            className={`flex max-w-[72%] flex-col gap-1 ${group.isMine ? "items-end" : "items-start"}`}
        >
            <span className="text-muted-foreground text-[11px] font-medium">
                {group.isMine ? "You" : group.senderName}
            </span>
            {group.items.map((msg, i) => (
                <div
                    key={msg.id}
                    className={`flex flex-col gap-0.5 ${group.isMine ? "items-end" : "items-start"}`}
                >
                    <div
                        className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                            group.isMine
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted rounded-tl-sm"
                        }`}
                    >
                        {msg.content}
                    </div>
                    {i === group.items.length - 1 && (
                        <span className="text-muted-foreground text-[10px]">
                            {formatTime(msg.created_at)}
                        </span>
                    )}
                </div>
            ))}
        </div>
    </div>
);

// ─── Date separator ───────────────────────────────────────────────────────────

const DateSep = ({ label }: { label: string }) => (
    <div className="flex items-center gap-3 py-1">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground bg-background px-1 text-[10px] font-medium uppercase tracking-wider">
            {label}
        </span>
        <div className="bg-border h-px flex-1" />
    </div>
);

// ─── Status pill ──────────────────────────────────────────────────────────────

const StatusPill = ({ status }: { status: string }) => {
    if (status === "connected")
        return (
            <span className="flex items-center gap-1 text-[11px] text-green-600">
                <span className="size-1.5 rounded-full bg-green-500" />
                Online
            </span>
        );
    if (status === "connecting")
        return (
            <span className="flex items-center gap-1 text-[11px] text-amber-500">
                <LoaderIcon className="size-3 animate-spin" />
                Connecting
            </span>
        );
    if (status === "reset")
        return (
            <span className="flex items-center gap-1 text-[11px] text-amber-600">
                <WifiOffIcon className="size-3" />
                Chat reset
            </span>
        );
    return (
        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
            <WifiOffIcon className="size-3" />
            Offline
        </span>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface ChatPanelProps {
    inquiryId: string;
    token: string;
    currentUserId: string;
    otherName?: string;
    className?: string;
    onReset?: () => void;
}

export const ChatPanel = ({
    inquiryId,
    token,
    currentUserId,
    otherName,
    className = "",
    onReset,
}: ChatPanelProps) => {
    const [input, setInput] = useState("");
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const handleReset = useCallback(() => {
        setInput("");
        onReset?.();
    }, [onReset]);
    const { messages, send, status } = useChat(inquiryId, token, handleReset);

    useEffect(() => {
        const container = messageContainerRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || status !== "connected") return;
        send(trimmed);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Build groups, then inject date separators
    const groups = buildGroups(messages, currentUserId);

    return (
        <div
            className={`border-border/80 flex min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm ${className}`}
        >
            {/* ── Header ── */}
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                        <MessageSquareIcon className="text-primary size-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-tight">
                            {otherName ? "Chat with " + otherName : "Messages"}
                        </p>
                        <StatusPill status={status} />
                    </div>
                </div>
                <span className="text-muted-foreground text-xs">
                    {messages.length > 0
                        ? messages.length + " message" + (messages.length !== 1 ? "s" : "")
                        : ""}
                </span>
            </div>

            {/* ── Message area ── */}
            <div
                ref={messageContainerRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
                style={{ scrollbarGutter: "stable" }}
            >
                {status === "connecting" && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <LoaderIcon className="text-muted-foreground/40 mb-3 size-8 animate-spin" />
                        <p className="text-muted-foreground text-sm">Connecting to chat…</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <WifiOffIcon className="text-muted-foreground/40 mb-3 size-8" />
                        <p className="text-sm font-medium">Could not connect</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Make sure the chat service is running on port 8002.
                        </p>
                    </div>
                )}

                {status === "reset" && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <WifiOffIcon className="text-muted-foreground/40 mb-3 size-8" />
                        <p className="text-sm font-medium">Conversation reset</p>
                        <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">
                            This conversation was cleared because the assigned agent changed.
                        </p>
                    </div>
                )}

                {status === "connected" && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquareIcon className="text-muted-foreground/30 mb-3 size-10" strokeWidth={1.5} />
                        <p className="text-sm font-medium">No messages yet</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Send a message to get started.
                        </p>
                    </div>
                )}

                {groups.map((group, index) => {
                    const showDate = index === 0 || group.date !== groups[index - 1].date;
                    return (
                        <div key={group.senderId + group.items[0].id}>
                            {showDate && <DateSep label={group.date} />}
                            <Group group={group} />
                        </div>
                    );
                })}
            </div>

            {/* ── Input bar ── */}
            <div className="shrink-0 border-t bg-muted/20 p-3">
                <form
                    className="flex items-end gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                >
                    <Textarea
                        className="min-h-[40px] max-h-32 flex-1 resize-none bg-background text-sm"
                        placeholder={
                            status === "connected"
                                ? "Type a message… (Enter to send, Shift+Enter for new line)"
                                : status === "reset"
                                  ? "Conversation reset"
                                  : status === "connecting"
                                    ? "Connecting…"
                                    : "Chat unavailable"
                        }
                        value={input}
                        rows={1}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={status !== "connected"}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="shrink-0"
                        disabled={!input.trim() || status !== "connected"}
                    >
                        <SendIcon className="size-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};
