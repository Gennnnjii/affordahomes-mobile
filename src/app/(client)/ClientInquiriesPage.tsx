import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { clientPortalApi } from "@/db/api/client.portal.api";
import type { ClientInquiry } from "@/types/inquiry-appointment";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
    BotIcon,
    Building2Icon,
    CalendarClockIcon,
    MessageSquareTextIcon,
    UserRoundIcon,
} from "lucide-react";

const inquiryStatusStyles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    responded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    closed: "bg-muted text-muted-foreground",
};

const inquiryStatusLabel = (status: string) => {
    if (status === "pending") return "Pending";
    if (status === "responded") return "Responded";
    if (status === "closed") return "Closed";
    return "Status unavailable";
};

const inquirySourceLabel = (source?: string | null) => {
    if (source === "ai_chat") return "Nexia assistance";
    if (!source || source === "manual") return "Property inquiry";
    return source.replace(/_/g, " ");
};

const formatSubmittedAt = (value?: string | null) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const inquiryAgentLabel = (inquiry: ClientInquiry) => {
    const agent = inquiry.agent;
    if (!agent) return "";
    return (
        `${agent.first_name?.trim() ?? ""} ${agent.last_name?.trim() ?? ""}`.trim() ||
        agent.email?.trim() ||
        ""
    );
};

const InquiryListSkeleton = () => (
    <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-border/80">
                <CardContent className="space-y-4 p-5">
                    <div className="flex justify-between gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);

const ClientInquiriesPage = () => {
    const inquiriesQuery = useQuery({
        queryKey: ["client", "inquiries"],
        queryFn: () => clientPortalApi.inquiries(),
        refetchInterval: 2_000,
    });

    const inquiries = inquiriesQuery.data?.data ?? [];

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">My inquiries</h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                        Track every AFFORDAHOMES property inquiry and Nexia assistance request.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link to="/properties">Browse properties</Link>
                </Button>
            </div>

            {inquiriesQuery.isPending ? (
                <InquiryListSkeleton />
            ) : inquiriesQuery.isError ? (
                <Card className="border-destructive/40">
                    <CardContent className="space-y-3 p-6 text-center">
                        <p className="text-destructive text-sm">
                            Could not load your inquiries.
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
                <Card className="border-border/80">
                    <CardContent className="space-y-3 p-8 text-center">
                        <MessageSquareTextIcon className="text-muted-foreground mx-auto size-8" />
                        <div>
                            <p className="font-medium">Start your first property inquiry</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Choose a property you&apos;re interested in to get started. If you
                                joined through an Agent referral, your inquiry will automatically be
                                connected to that Agent.
                            </p>
                        </div>
                        <Button size="sm" asChild>
                            <Link to="/properties">Choose property</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {inquiries.map((inquiry) => {
                        const status = String(inquiry.status ?? "");
                        const propertyTitle = inquiry.property?.title?.trim() || "General inquiry";
                        const agentLabel = inquiryAgentLabel(inquiry);
                        const isAiInquiry = inquiry.source === "ai_chat";

                        return (
                            <Card
                                key={inquiry.id}
                                className="border-border/80 overflow-hidden shadow-sm"
                            >
                                <CardContent className="flex h-full flex-col gap-4 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <h2 className="truncate font-semibold">
                                                {inquiry.subject?.trim() || "Inquiry"}
                                            </h2>
                                            <p className="text-muted-foreground mt-1 break-all font-mono text-xs">
                                                {inquiry.id}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                                                inquiryStatusStyles[status] ??
                                                "bg-muted text-muted-foreground",
                                            )}
                                        >
                                            {inquiryStatusLabel(status)}
                                        </span>
                                    </div>

                                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                                        {inquiry.message?.trim() || "No message provided."}
                                    </p>

                                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-xs">
                                        <span className="inline-flex items-center gap-1.5">
                                            {isAiInquiry ? (
                                                <BotIcon className="size-3.5" />
                                            ) : (
                                                <MessageSquareTextIcon className="size-3.5" />
                                            )}
                                            {inquirySourceLabel(inquiry.source)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <CalendarClockIcon className="size-3.5" />
                                            {formatSubmittedAt(inquiry.created_at)}
                                        </span>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="bg-muted/40 rounded-lg border p-3">
                                            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                                <Building2Icon className="size-3.5" />
                                                Property
                                            </p>
                                            <p className="mt-1 truncate text-sm font-medium">
                                                {propertyTitle}
                                            </p>
                                        </div>
                                        <div className="bg-muted/40 rounded-lg border p-3">
                                            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                                <UserRoundIcon className="size-3.5" />
                                                Assigned agent
                                            </p>
                                            <p
                                                className={cn(
                                                    "mt-1 truncate text-sm font-medium",
                                                    !agentLabel && "text-muted-foreground italic",
                                                )}
                                            >
                                                {agentLabel || "Awaiting agent"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex justify-end border-t pt-4">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link
                                                to="/dashboard/inquiries/$inquiryId"
                                                params={{ inquiryId: inquiry.id }}
                                            >
                                                View inquiry
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ClientInquiriesPage;
