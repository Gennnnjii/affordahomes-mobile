import { ChatPanel } from "@/components/chat/ChatPanel";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { clientPortalApi } from "@/db/api/client.portal.api";
import { useAuth } from "@/db/queries/useAuth";
import { publicStorageUrl } from "@/lib/storage-url";
import { getClientToken } from "@/lib/tokens";
import { userInitials } from "@/lib/userInitials";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
    Building2Icon,
    MapPinIcon,
    MessageSquareTextIcon,
    UserRoundIcon,
} from "lucide-react";
import { useCallback } from "react";

const ClientChatConversationPage = () => {
    const { inquiryId } = useParams({ strict: false }) as { inquiryId: string };
    const queryClient = useQueryClient();
    const { sessionQuery } = useAuth();
    const currentUserId =
        (sessionQuery.data?.data as { id_?: string } | undefined)?.id_ ?? "";
    const clientToken = getClientToken() ?? "";

    const inquiryQuery = useQuery({
        queryKey: ["client", "inquiries", inquiryId],
        queryFn: () => clientPortalApi.inquiry(inquiryId),
        enabled: Boolean(inquiryId),
    });

    const refreshChatAssignment = useCallback(() => {
        const refresh = () => {
            void queryClient.invalidateQueries({
                queryKey: ["client", "inquiries"],
                exact: true,
            });
            void queryClient.invalidateQueries({
                queryKey: ["client", "inquiries", inquiryId],
                exact: true,
            });
            void queryClient.invalidateQueries({
                queryKey: ["client", "agent-reassignment-requests"],
            });
        };

        refresh();
        window.setTimeout(refresh, 1500);
    }, [inquiryId, queryClient]);

    const inquiry = inquiryQuery.data?.data;
    const agent = inquiry?.agent;
    const property = inquiry?.property;
    const assignedAgentId = inquiry?.agent_id?.trim() ?? "";
    const agentName = agent
        ? `${agent.first_name?.trim() ?? ""} ${agent.last_name?.trim() ?? ""}`.trim()
        : "";
    const agentIdentity = agentName || agent?.email?.trim() || "Assigned agent";
    const agentPhotoUrl = publicStorageUrl(agent?.profile_picture);
    const agentInitials = userInitials(
        agent?.first_name ?? undefined,
        agent?.last_name ?? undefined,
        agent?.email ?? undefined,
    );
    const propertyLocation = property
        ? [property.project, property.city_municipality, property.province]
              .map((value) => value?.trim())
              .filter(Boolean)
              .join(", ")
        : "";
    const canOpenChat = Boolean(assignedAgentId && clientToken && currentUserId);

    return (
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col gap-4">
            <ScreenBackLink to="/dashboard/chat" label="Back to conversations" />

            <div className="min-w-0">
                <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                    AFFORDAHOMES messages
                </p>
                <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight">
                    Conversation
                </h1>
            </div>

            {inquiryQuery.isPending ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-[32rem] w-full rounded-xl" />
                </div>
            ) : inquiryQuery.isError || !inquiry ? (
                <Card className="border-destructive/40">
                    <CardContent className="space-y-3 p-6 text-center">
                        <p className="text-destructive text-sm">
                            Could not load this conversation.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => inquiryQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card className="border-border/80 shrink-0 shadow-sm">
                        <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] md:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="bg-muted relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
                                    {assignedAgentId ? (
                                        <span className="text-muted-foreground text-sm font-semibold">
                                            {agentInitials}
                                        </span>
                                    ) : (
                                        <UserRoundIcon className="text-muted-foreground size-5" />
                                    )}
                                    {assignedAgentId && agentPhotoUrl ? (
                                        <img
                                            key={`${assignedAgentId}:${agentPhotoUrl}`}
                                            src={agentPhotoUrl}
                                            alt={`${agentIdentity} profile photo`}
                                            className="absolute inset-0 size-full object-cover"
                                            onError={(event) => {
                                                event.currentTarget.hidden = true;
                                            }}
                                        />
                                    ) : null}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Assigned agent
                                    </p>
                                    <p className="truncate font-semibold">
                                        {assignedAgentId ? agentIdentity : "Awaiting assignment"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex min-w-0 items-start gap-3">
                                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                                    <Building2Icon className="text-primary size-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Property
                                    </p>
                                    <p className="break-words font-semibold">
                                        {property?.title?.trim() || "General inquiry"}
                                    </p>
                                    {propertyLocation ? (
                                        <p className="text-muted-foreground mt-1 flex items-start gap-1.5 text-sm">
                                            <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                                            <span className="break-words">{propertyLocation}</span>
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                {property?.status?.trim() ? (
                                    <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs font-medium capitalize">
                                        {property.status.trim()}
                                    </span>
                                ) : null}
                                {property?.id ? (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            to="/property/$propertyId"
                                            params={{ propertyId: property.id }}
                                        >
                                            View property
                                        </Link>
                                    </Button>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    {!assignedAgentId ? (
                        <Card className="border-border/80 shadow-sm">
                            <CardContent className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
                                <MessageSquareTextIcon className="text-muted-foreground mb-3 size-8" />
                                <p className="font-medium">Awaiting an assigned agent</p>
                                <p className="text-muted-foreground mt-1 max-w-md text-sm leading-relaxed">
                                    Chat will become available after an AFFORDAHOMES agent is assigned
                                    to this inquiry.
                                </p>
                            </CardContent>
                        </Card>
                    ) : canOpenChat ? (
                        <ChatPanel
                            key={`${inquiry.id}:${assignedAgentId}`}
                            inquiryId={inquiry.id}
                            token={clientToken}
                            currentUserId={currentUserId}
                            className="h-[min(42rem,calc(100dvh-18rem))] min-h-[24rem]"
                            onReset={refreshChatAssignment}
                        />
                    ) : (
                        <Card className="border-border/80 shadow-sm">
                            <CardContent className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
                                <MessageSquareTextIcon className="text-muted-foreground mb-3 size-8" />
                                <p className="font-medium">Chat unavailable</p>
                                <p className="text-muted-foreground mt-1 max-w-md text-sm leading-relaxed">
                                    Your secure Client chat session could not be started. Refresh the
                                    page and try again.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default ClientChatConversationPage;
