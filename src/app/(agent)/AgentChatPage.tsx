import {
    ConversationInboxCard,
    ConversationInboxSkeleton,
    type ConversationActivityState,
} from "@/components/chat/ConversationInboxCard";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { agentPortalApi } from "@/db/api/agent.portal.api";
import { useChatInboxMetadata } from "@/hooks/use-chat-inbox";
import { getAgentToken } from "@/lib/tokens";
import type { ClientInquiry } from "@/types/inquiry-appointment";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MessageSquareIcon } from "lucide-react";

const clientName = (inquiry: ClientInquiry) => {
    const client = inquiry.client;
    if (!client) return "Client";

    return (
        `${client.first_name?.trim() ?? ""} ${client.last_name?.trim() ?? ""}`.trim() ||
        client.email?.trim() ||
        "Client"
    );
};

const AgentChatPage = () => {
    const agentToken = getAgentToken();
    const inquiriesQuery = useQuery({
        queryKey: ["agent", "inquiries"],
        queryFn: () => agentPortalApi.inquiries(),
        refetchInterval: 2_000,
    });
    const metadataQuery = useChatInboxMetadata("agent", agentToken);
    const inquiries = (inquiriesQuery.data?.data ?? []) as ClientInquiry[];

    const activityStateFor = (inquiryId: string): ConversationActivityState => {
        if (!agentToken || metadataQuery.isError) return "unavailable";
        if (metadataQuery.isPending) return "loading";
        return metadataQuery.data?.[inquiryId] ? "ready" : "unavailable";
    };

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/agent" label="Dashboard" hideFrom="md" />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                        Client conversations
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">Chat</h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                        Continue conversations for inquiries currently assigned to you.
                    </p>
                </div>
                {inquiriesQuery.isSuccess && inquiries.length > 0 ? (
                    <p className="text-muted-foreground text-sm">
                        {inquiries.length} {inquiries.length === 1 ? "conversation" : "conversations"}
                    </p>
                ) : null}
            </div>

            {inquiriesQuery.isPending ? (
                <div className="mx-auto max-w-4xl">
                    <ConversationInboxSkeleton />
                </div>
            ) : inquiriesQuery.isError ? (
                <Card className="border-destructive/40 mx-auto max-w-4xl">
                    <CardContent className="space-y-3 p-6 text-center">
                        <p className="text-destructive text-sm">
                            Could not load your assigned conversations.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => inquiriesQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            ) : inquiries.length === 0 ? (
                <Card className="border-border/80 mx-auto max-w-4xl">
                    <CardContent className="space-y-3 p-8 text-center">
                        <MessageSquareIcon className="text-muted-foreground mx-auto size-9" />
                        <div>
                            <p className="font-medium">No assigned conversations</p>
                            <p className="text-muted-foreground mx-auto mt-1 max-w-lg text-sm leading-relaxed">
                                Conversations appear here after you claim an inquiry.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/dashboard/agent/reservations">View inquiries</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="mx-auto max-w-4xl space-y-3">
                    {metadataQuery.isError ? (
                        <div className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
                            <p className="text-muted-foreground text-sm">
                                Message previews are temporarily unavailable. Inquiry access remains
                                available.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => metadataQuery.refetch()}
                            >
                                Retry previews
                            </Button>
                        </div>
                    ) : null}

                    {inquiries.map((inquiry) => {
                        const status = String(inquiry.status ?? "");
                        const name = clientName(inquiry);
                        const metadata = metadataQuery.data?.[inquiry.id];
                        const lastMessageSenderLabel =
                            metadata?.last_message?.sender_type === "agent" ? "You" : name;
                        const isClosed = status === "closed";

                        return (
                            <ConversationInboxCard
                                key={inquiry.id}
                                participantLabel="Client"
                                participantName={name}
                                inquirySubject={inquiry.subject?.trim() || "Inquiry"}
                                propertyTitle={
                                    inquiry.property?.title?.trim() || "General inquiry"
                                }
                                status={status}
                                metadata={metadata}
                                activityState={activityStateFor(inquiry.id)}
                                lastMessageSenderLabel={lastMessageSenderLabel}
                                actions={
                                    <Button
                                        size="sm"
                                        variant={isClosed ? "outline" : "default"}
                                        asChild
                                    >
                                        <Link
                                            to="/dashboard/agent/reservation/$reservationId"
                                            params={{ reservationId: inquiry.id }}
                                        >
                                            {isClosed ? "View inquiry" : "Open conversation"}
                                        </Link>
                                    </Button>
                                }
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AgentChatPage;
