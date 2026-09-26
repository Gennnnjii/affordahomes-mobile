import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ChatInboxMetadata } from "@/types/chat-inbox";
import { Building2Icon, MessageSquareIcon, UserRoundIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ConversationActivityState = "loading" | "ready" | "unavailable";

interface ConversationInboxCardProps {
    participantLabel: string;
    participantName: string;
    inquirySubject: string;
    propertyTitle: string;
    status: string;
    metadata?: ChatInboxMetadata;
    activityState: ConversationActivityState;
    lastMessageSenderLabel?: string;
    actions: ReactNode;
}

const statusStyles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    responded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    closed: "bg-muted text-muted-foreground",
};

const statusLabel = (status: string) => {
    if (status === "pending") return "Pending";
    if (status === "responded") return "Responded";
    if (status === "closed") return "Closed";
    return "Status unavailable";
};

const timestampHasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const formatActivity = (value?: string | null) => {
    if (!value) return "";

    const normalized = timestampHasTimeZone.test(value.trim()) ? value : `${value}Z`;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

export const ConversationInboxCard = ({
    participantLabel,
    participantName,
    inquirySubject,
    propertyTitle,
    status,
    metadata,
    activityState,
    lastMessageSenderLabel,
    actions,
}: ConversationInboxCardProps) => {
    const lastMessage = metadata?.last_message;
    const lastActivity = formatActivity(metadata?.last_activity_at);

    return (
        <Card className="border-border/80 overflow-hidden shadow-sm">
            <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
                            <UserRoundIcon className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-muted-foreground text-xs">{participantLabel}</p>
                            <h2 className="truncate font-semibold">{participantName}</h2>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                        <span
                            className={cn(
                                "rounded-md px-2 py-0.5 text-xs font-semibold",
                                statusStyles[status] ?? "bg-muted text-muted-foreground",
                            )}
                        >
                            {statusLabel(status)}
                        </span>
                        {lastActivity ? (
                            <span className="text-muted-foreground text-xs">{lastActivity}</span>
                        ) : null}
                    </div>
                </div>

                <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                    <div className="bg-muted/35 min-w-0 rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">Inquiry</p>
                        <p className="mt-1 truncate text-sm font-medium">{inquirySubject}</p>
                    </div>
                    <div className="bg-muted/35 min-w-0 rounded-lg border p-3">
                        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <Building2Icon className="size-3.5 shrink-0" />
                            Property
                        </p>
                        <p className="mt-1 truncate text-sm font-medium">{propertyTitle}</p>
                    </div>
                </div>

                <div className="bg-muted/25 min-w-0 rounded-lg border px-3 py-2.5">
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <MessageSquareIcon className="size-3.5 shrink-0" />
                        Latest message
                    </p>
                    {activityState === "loading" ? (
                        <Skeleton className="mt-2 h-4 w-4/5" />
                    ) : activityState === "unavailable" ? (
                        <p className="text-muted-foreground mt-1 text-sm">
                            Message activity is temporarily unavailable.
                        </p>
                    ) : lastMessage ? (
                        <p className="mt-1 line-clamp-2 break-words text-sm">
                            <span className="font-medium">
                                {lastMessageSenderLabel || lastMessage.sender_name}:
                            </span>{" "}
                            {lastMessage.content}
                        </p>
                    ) : (
                        <p className="text-muted-foreground mt-1 text-sm">No messages yet.</p>
                    )}
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t pt-3">{actions}</div>
            </CardContent>
        </Card>
    );
};

export const ConversationInboxSkeleton = () => (
    <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-border/80">
                <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-5 w-44" />
                        </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Skeleton className="h-14 rounded-lg" />
                        <Skeleton className="h-14 rounded-lg" />
                    </div>
                    <Skeleton className="h-16 rounded-lg" />
                </CardContent>
            </Card>
        ))}
    </div>
);
