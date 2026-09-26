import { useEffect, useRef, useState, useCallback } from "react";
import { BotMessageSquareIcon, SendIcon, XIcon, RefreshCwIcon } from "lucide-react";
import { getClientToken } from "@/lib/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageRole = "user" | "assistant";

interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    streaming?: boolean;
}

type WsEvent =
    | { type: "token"; content: string }
    | { type: "human_request_created"; inquiry_id: string }
    | { type: "human_request_failed"; message: string }
    | { type: "human_request_auth_required"; message: string }
    | { type: "done" }
    | { type: "error"; content: string };

const GREETING_MESSAGE: ChatMessage = {
    id: "greeting",
    role: "assistant",
    content:
        "Hi! I'm Nexia, the AFFORDAHOMES assistant. Ask me anything about our properties, the reservation process, Pag-IBIG financing, or site visits.",
};

// ---------------------------------------------------------------------------
// Session ID persisted in localStorage
// ---------------------------------------------------------------------------

function getSessionId(): string {
    const key = "fiesta_ai_session";
    let id = localStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }
    return id;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const WS_BASE = (import.meta.env.VITE_AI_WS_URL ?? "ws://localhost:8001").replace(/\/$/, "");

export const AiChatWidget = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE]);
    const [input, setInput] = useState("");
    const [connected, setConnected] = useState(false);
    const [waiting, setWaiting] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const requestPendingRef = useRef(false);
    const sessionId = useRef(getSessionId());
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    // ------------------------------------------------------------------
    // WebSocket management
    // ------------------------------------------------------------------

    const connect = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState < 2) {
            return wsRef.current; // already open/connecting
        }

        const ws = new WebSocket(`${WS_BASE}/ws/${sessionId.current}`);
        wsRef.current = ws;

        ws.onopen = () => {
            if (wsRef.current === ws) setConnected(true);
        };
        ws.onclose = () => {
            if (wsRef.current !== ws) return;
            setConnected(false);
            requestPendingRef.current = false;
            setWaiting(false);
        };
        ws.onerror = () => {
            if (wsRef.current !== ws) return;
            setConnected(false);
            requestPendingRef.current = false;
            setWaiting(false);
        };

        ws.onmessage = (evt: MessageEvent<string>) => {
            if (wsRef.current !== ws) return;

            let parsed: WsEvent;
            try {
                parsed = JSON.parse(evt.data) as WsEvent;
            } catch {
                return;
            }

            if (parsed.type === "token") {
                if (parsed.content.trim() === "__HUMAN_AGENT_REQUEST__") return;

                setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.streaming) {
                        return [
                            ...prev.slice(0, -1),
                            { ...last, content: last.content + parsed.content },
                        ];
                    }
                    return [
                        ...prev,
                        {
                            id: crypto.randomUUID(),
                            role: "assistant",
                            content: parsed.content,
                            streaming: true,
                        },
                    ];
                });
            } else if (parsed.type === "done") {
                setMessages((prev) =>
                    prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
                );
                requestPendingRef.current = false;
                setWaiting(false);
            } else if (parsed.type === "error") {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: parsed.content ?? "Something went wrong. Please try again.",
                    },
                ]);
                requestPendingRef.current = false;
                setWaiting(false);
            } else if (parsed.type === "human_request_created") {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content:
                            "Your request was sent to an AFFORDAHOMES agent. An available agent can review it from the inquiry queue.",
                    },
                ]);
            } else if (parsed.type === "human_request_failed") {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content:
                            "We couldn't send your request to an AFFORDAHOMES agent right now. Please try again.",
                    },
                ]);
            } else if (parsed.type === "human_request_auth_required") {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content:
                            "Please sign in to your AFFORDAHOMES client account to request help from an agent.",
                    },
                ]);
            }
        };

        return ws;
    }, []);

    // Connect when chat opens
    useEffect(() => {
        if (open) connect();
    }, [open, connect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => wsRef.current?.close();
    }, []);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 80);
    }, [open]);

    // ------------------------------------------------------------------
    // Send
    // ------------------------------------------------------------------

    const send = useCallback(() => {
        const text = input.trim();
        if (!text || waiting || requestPendingRef.current) return;

        requestPendingRef.current = true;

        const accessToken = getClientToken()?.trim();
        const payload = accessToken
            ? { message: text, access_token: accessToken, role: "client" as const }
            : { message: text };
        const serializedPayload = JSON.stringify(payload);

        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "user", content: text },
        ]);
        setInput("");
        setWaiting(true);

        try {
            const socket = connect();
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(serializedPayload);
            } else {
                socket.addEventListener(
                    "open",
                    () => {
                        if (
                            wsRef.current === socket &&
                            requestPendingRef.current &&
                            socket.readyState === WebSocket.OPEN
                        ) {
                            socket.send(serializedPayload);
                        }
                    },
                    { once: true },
                );
            }
        } catch {
            requestPendingRef.current = false;
            setWaiting(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: "Unable to connect to Nexia right now. Please try again.",
                },
            ]);
        }
    }, [input, waiting, connect]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    return (
        <>
            {/* Floating toggle button */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Open AI chat"
                className={`fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    open
                        ? "bg-muted text-foreground focus-visible:ring-muted"
                        : "bg-green-600 text-white focus-visible:ring-green-600"
                }`}
            >
                {open ? <XIcon className="size-5" /> : <BotMessageSquareIcon className="size-6" />}
            </button>

            {/* Chat panel */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 flex w-[350px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl">

                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 bg-green-600 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <BotMessageSquareIcon className="size-5 text-white" />
                            <div>
                                <p className="text-sm font-semibold text-white leading-none">
                                    Nexia · AFFORDAHOMES
                                </p>
                                <p className="mt-0.5 text-xs text-green-100">
                                    {connected ? "Online" : "Connecting…"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                title="New conversation"
                                disabled={waiting}
                                onClick={() => {
                                    if (requestPendingRef.current) return;
                                    sessionId.current = crypto.randomUUID();
                                    localStorage.setItem("fiesta_ai_session", sessionId.current);
                                    setMessages([GREETING_MESSAGE]);
                                    requestPendingRef.current = false;
                                    setWaiting(false);
                                    wsRef.current?.close();
                                    connect();
                                }}
                                className="rounded-lg p-1.5 text-green-100 transition-colors hover:bg-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RefreshCwIcon className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-lg p-1.5 text-green-100 transition-colors hover:bg-green-500 hover:text-white"
                            >
                                <XIcon className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        className="flex flex-col gap-3 overflow-y-auto px-4 py-4"
                        style={{ minHeight: 280, maxHeight: 420 }}
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="mr-2 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                                        <BotMessageSquareIcon className="size-3.5 text-green-700" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                        msg.role === "user"
                                            ? "rounded-br-sm bg-green-600 text-white"
                                            : "rounded-bl-sm bg-muted text-foreground"
                                    }`}
                                >
                                    {msg.content}
                                    {msg.streaming && (
                                        <span className="ml-1 inline-block h-3 w-1.5 animate-pulse rounded-sm bg-current opacity-60" />
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator (waiting for first token) */}
                        {waiting && !messages.some((m) => m.streaming) && (
                            <div className="flex justify-start">
                                <div className="mr-2 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                                    <BotMessageSquareIcon className="size-3.5 text-green-700" />
                                </div>
                                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                                    <span className="flex gap-1">
                                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-border/60 bg-background px-3 py-3">
                        <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask anything…"
                                disabled={waiting}
                                className="max-h-28 flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                                style={{ lineHeight: "1.5rem" }}
                            />
                            <button
                                type="button"
                                onClick={send}
                                disabled={!input.trim() || waiting}
                                className="mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white transition-opacity hover:bg-green-700 disabled:opacity-40"
                            >
                                <SendIcon className="size-3.5" />
                            </button>
                        </div>
                        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                            AI can make mistakes. Confirm details with an agent.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};
