import {
    ConversationInboxCard,
    ConversationInboxSkeleton,
    type ConversationActivityState,
} from "@/components/chat/ConversationInboxCard";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clientPortalApi } from "@/db/api/client.portal.api";
import { useChatInboxMetadata } from "@/hooks/use-chat-inbox";
import { getClientToken } from "@/lib/tokens";
import type { ClientInquiry } from "@/types/inquiry-appointment";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MessageSquareIcon } from "lucide-react";

const assignedAgentName = (inquiry: ClientInquiry) => {
    const agent = inquiry.agent;
    if (!agent) return "Assigned AFFORDAHOMES agent";

    return (
        `${agent.first_name?.trim() ?? ""} ${agent.last_name?.trim() ?? ""}`.trim() ||
        agent.email?.trim() ||
        "Assigned AFFORDAHOMES agent"
    );
};

const ClientChatPage = () => {
    const clientToken = getClientToken();
    const inquiriesQuery = useQuery({
        queryKey: ["client", "inquiries"],
        queryFn: () => clientPortalApi.inquiries(),
        refetchInterval: 2_000,
    });
    const metadataQuery = useChatInboxMetadata("client", clientToken);

    const assignedInquiries = (inquiriesQuery.data?.data ?? []).filter((inquiry) =>
        Boolean(inquiry.agent_id),
    );

    const activityStateFor = (inquiryId: string): ConversationActivityState => {
        if (!clientToken || metadataQuery.isError) return "unavailable";
        if (metadataQuery.isPending) return "loading";
        return metadataQuery.data?.[inquiryId] ? "ready" : "unavailable";
    };

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                        AFFORDAHOMES messages
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">Chat</h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                        Continue conversations with the agents assigned to your inquiries.
                    </p>
                </div>
                {inquiriesQuery.isSuccess && assignedInquiries.length > 0 ? (
                    <p className="text-muted-foreground text-sm">
                        {assignedInquiries.length}{" "}
                        {assignedInquiries.length === 1 ? "conversation" : "conversations"}
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
                            Could not load your available conversations.
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
            ) : assignedInquiries.length === 0 ? (
                <Card className="border-border/80 mx-auto max-w-4xl">
                    <CardContent className="space-y-3 p-8 text-center">
                        <MessageSquareIcon className="text-muted-foreground mx-auto size-9" />
                        <div>
                            <p className="font-medium">No conversations available</p>
                            <p className="text-muted-foreground mx-auto mt-1 max-w-lg text-sm leading-relaxed">
                                Chat becomes available after an AFFORDAHOMES agent is assigned to
                                one of your inquiries.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/dashboard/inquiries">View My Inquiries</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="mx-auto max-w-4xl space-y-3">
                    {metadataQuery.isError ? (
                        <div className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
                            <p className="text-muted-foreground text-sm">
                                Message previews are temporarily unavailable. You can still open
                                your conversations.
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

                    {assignedInquiries.map((inquiry) => {
                        const agentName = assignedAgentName(inquiry);
                        const metadata = metadataQuery.data?.[inquiry.id];
                        const lastMessageSenderLabel =
                            metadata?.last_message?.sender_type === "client" ? "You" : agentName;

                        return (
                            <ConversationInboxCard
                                key={inquiry.id}
                                participantLabel="Assigned agent"
                                participantName={agentName}
                                inquirySubject={inquiry.subject?.trim() || "Inquiry"}
                                propertyTitle={
                                    inquiry.property?.title?.trim() || "General inquiry"
                                }
                                status={String(inquiry.status ?? "")}
                                metadata={metadata}
                                activityState={activityStateFor(inquiry.id)}
                                lastMessageSenderLabel={lastMessageSenderLabel}
                                actions={
                                    <Button size="sm" asChild>
                                        <Link
                                            to="/dashboard/chat/$inquiryId"
                                            params={{ inquiryId: inquiry.id }}
                                        >
                                            Open conversation
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

export default ClientChatPage;
