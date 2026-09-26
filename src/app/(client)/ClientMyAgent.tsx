import {
    clientPortalApi,
    type ClientAgentRating,
} from "@/db/api/client.portal.api";
import { asRecord, str } from "@/lib/record";
import { getApiErrorMessage } from "@/lib/api-error";
import { publicStorageUrl } from "@/lib/storage-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { MailIcon, MapPinIcon, PhoneIcon, UserIcon } from "lucide-react";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type AgentEntry = {
    id: string;
    name: string;
    email?: string;
    position?: string;
    location?: string;
    mobile?: string;
    profilePicture?: string;
    canRate: boolean;
    rating: ClientAgentRating | null;
};

const servedAgentsQueryKey = ["client", "served-agents"] as const;

const formatDate = (value?: string | null): string | null => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const normalizeRating = (value: unknown): ClientAgentRating | null => {
    const rating = asRecord(value);
    const id = str(rating.id)?.trim();
    const ratingValue = Number(rating.rating);

    if (!id || !Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        return null;
    }

    return {
        id,
        rating: ratingValue,
        comment: str(rating.comment) ?? null,
        created_at: str(rating.created_at) ?? null,
    };
};

const normalizeServedAgent = (value: unknown): AgentEntry | null => {
    const item = asRecord(value);
    const agent = asRecord(item.agent);
    const id = str(agent.id)?.trim();

    if (!id) return null;

    const firstName = str(agent.first_name)?.trim() ?? "";
    const lastName = str(agent.last_name)?.trim() ?? "";
    const rating = normalizeRating(item.rating);

    return {
        id,
        name: `${firstName} ${lastName}`.trim() || "Agent",
        email: str(agent.email) ?? undefined,
        position: str(agent.position) ?? undefined,
        location: str(agent.location) ?? undefined,
        mobile: str(agent.mobile) ?? undefined,
        profilePicture: str(agent.profile_picture) ?? undefined,
        canRate: item.can_rate === true && item.rating === null,
        rating,
    };
};

const responseHasAgentRating = (response: unknown, agentId: string): boolean => {
    const data = asRecord(response).data;

    if (!Array.isArray(data)) return false;

    return data.some((value) => {
        const item = asRecord(value);
        const agent = asRecord(item.agent);

        return str(agent.id)?.trim() === agentId && normalizeRating(item.rating) !== null;
    });
};

const AgentIdentity = ({ agent, compact = false }: { agent: AgentEntry; compact?: boolean }) => {
    const imgSrc = publicStorageUrl(agent.profilePicture);
    const initials = agent.name
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("");

    return (
        <div className="flex min-w-0 items-center gap-3">
            {imgSrc ? (
                <img
                    src={imgSrc}
                    alt=""
                    className={`${compact ? "size-11" : "size-12"} shrink-0 rounded-full object-cover object-top`}
                />
            ) : (
                <div
                    className={`bg-primary/10 text-primary flex ${compact ? "size-11" : "size-12"} shrink-0 items-center justify-center rounded-full font-bold`}
                    aria-hidden="true"
                >
                    {initials || <UserIcon className="size-5" />}
                </div>
            )}
            <div className="min-w-0">
                <p className="truncate font-semibold">{agent.name || "Agent"}</p>
                {agent.email ? (
                    <p className="text-muted-foreground truncate text-sm">{agent.email}</p>
                ) : null}
            </div>
        </div>
    );
};

const AgentRatingDialog = ({
    agent,
    open,
    onOpenChange,
}: {
    agent: AgentEntry;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const queryClient = useQueryClient();
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const alreadyRated = agent.rating !== null;
    const canRate = agent.canRate && !alreadyRated;
    const ratingSubmittedOn = formatDate(agent.rating?.created_at);

    const submitRatingMutation = useMutation({
        mutationFn: ({ rating, comment }: { rating: number; comment?: string }) => {
            if (!canRate || rating < 1 || rating > 5) {
                return Promise.reject(new Error("Select a rating before submitting."));
            }

            return clientPortalApi.rateAgent(agent.id, {
                rating,
                comment,
            });
        },
        onSuccess: async (response) => {
            const submittedRating = normalizeRating(response.data);

            if (submittedRating) {
                queryClient.setQueryData<Awaited<ReturnType<typeof clientPortalApi.servedAgents>>>(
                    servedAgentsQueryKey,
                    (current) => {
                        if (!current || !Array.isArray(current.data)) return current;

                        return {
                            ...current,
                            data: current.data.map((item) =>
                                item.agent?.id === agent.id
                                    ? {
                                          ...item,
                                          can_rate: false,
                                          rating: submittedRating,
                                      }
                                    : item,
                            ),
                        };
                    },
                );
            }

            await queryClient.invalidateQueries({ queryKey: servedAgentsQueryKey });
            setRatingValue(0);
            setRatingComment("");
            toast.success("Rating submitted. Thank you for your feedback!");
        },
        onError: async (error) => {
            await queryClient.invalidateQueries({ queryKey: servedAgentsQueryKey });
            const refreshed = queryClient.getQueryData(servedAgentsQueryKey);

            if (responseHasAgentRating(refreshed, agent.id)) {
                toast.info("You have already rated this agent.");
                return;
            }

            toast.error(getApiErrorMessage(error));
        },
    });

    const handleOpenChange = (nextOpen: boolean) => {
        if (submitRatingMutation.isPending) return;
        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90dvh] min-w-0 overflow-x-hidden overflow-y-auto sm:max-w-2xl">
                <DialogHeader className="min-w-0">
                    <DialogTitle className="break-words pr-6">
                        Rate your experience with {agent.name || "your agent"}
                    </DialogTitle>
                    <DialogDescription>
                        {alreadyRated
                            ? "Your submitted rating is read-only and cannot be changed."
                            : "You can rate this agent once. Ratings cannot be changed after submission."}
                    </DialogDescription>
                </DialogHeader>

                <AgentIdentity agent={agent} compact />

                {alreadyRated ? (
                    <div className="min-w-0 space-y-3 rounded-lg border p-4">
                        <StarRating value={agent.rating?.rating ?? 0} readonly />
                        {agent.rating?.comment?.trim() ? (
                            <p className="text-muted-foreground whitespace-pre-wrap break-words text-sm italic">
                                &ldquo;{agent.rating.comment.trim()}&rdquo;
                            </p>
                        ) : null}
                        <p className="text-muted-foreground text-xs font-medium">
                            Rating submitted
                            {ratingSubmittedOn ? ` on ${ratingSubmittedOn}` : ""}
                        </p>
                    </div>
                ) : canRate ? (
                    <div className="min-w-0 space-y-4">
                        <div className="space-y-2">
                            <Label>Your rating</Label>
                            <StarRating value={ratingValue} onChange={setRatingValue} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="agent-rating-comment">Comment (optional)</Label>
                                <span className="text-muted-foreground text-xs">
                                    {ratingComment.length}/500
                                </span>
                            </div>
                            <Textarea
                                id="agent-rating-comment"
                                value={ratingComment}
                                maxLength={500}
                                rows={4}
                                placeholder="Share your experience (optional)"
                                disabled={submitRatingMutation.isPending}
                                className="min-w-0 max-w-full resize-y break-words"
                                onChange={(event) => setRatingComment(event.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground min-w-0 rounded-lg border border-dashed p-4 text-sm">
                        Rating is unavailable while your served-Agent status is being confirmed.
                    </p>
                )}

                <DialogFooter className="min-w-0 flex-wrap">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={submitRatingMutation.isPending}
                        onClick={() => handleOpenChange(false)}
                    >
                        Close
                    </Button>
                    {canRate ? (
                        <Button
                            type="button"
                            disabled={ratingValue === 0 || submitRatingMutation.isPending}
                            onClick={() =>
                                submitRatingMutation.mutate({
                                    rating: ratingValue,
                                    comment: ratingComment.trim() || undefined,
                                })
                            }
                        >
                            {submitRatingMutation.isPending ? "Submitting..." : "Submit rating"}
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const AgentCardSkeleton = () => (
    <Card className="border-border/80 overflow-hidden p-0">
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    </Card>
);

const ClientMyAgent = () => {
    const [ratingAgentId, setRatingAgentId] = useState<string | null>(null);
    const servedAgentsQuery = useQuery({
        queryKey: servedAgentsQueryKey,
        queryFn: () => clientPortalApi.servedAgents(),
    });

    const agents = useMemo<AgentEntry[]>(() => {
        const data = servedAgentsQuery.data?.data;

        if (!Array.isArray(data)) return [];

        return data
            .map((item) => normalizeServedAgent(item))
            .filter((agent): agent is AgentEntry => agent !== null);
    }, [servedAgentsQuery.data]);

    const ratingAgent = agents.find((agent) => agent.id === ratingAgentId);

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">My agents</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Agents who have served you through verified AFFORDAHOMES assignments.
                </p>
            </div>

            {servedAgentsQuery.isPending ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <AgentCardSkeleton key={i} />
                    ))}
                </div>
            ) : servedAgentsQuery.isError ? (
                <div className="space-y-3 rounded-lg border border-dashed p-5">
                    <p className="text-destructive text-sm">Could not load your served agents.</p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => servedAgentsQuery.refetch()}
                    >
                        Try again
                    </Button>
                </div>
            ) : agents.length === 0 ? (
                <p className="text-muted-foreground">No served agents are available yet.</p>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {agents.map((a) => {
                        const imgSrc = publicStorageUrl(a.profilePicture);
                        const initials = a.name
                            .split(" ")
                            .slice(0, 2)
                            .map((w) => w[0]?.toUpperCase() ?? "")
                            .join("");

                        return (
                            <Card
                                key={a.id}
                                className="border-border/80 h-full overflow-hidden p-0 shadow-sm"
                            >
                                {imgSrc ? (
                                    <img
                                        src={imgSrc}
                                        alt={a.name}
                                        className="aspect-square w-full object-cover object-top"
                                    />
                                ) : (
                                    <div className="bg-primary/10 aspect-square flex items-center justify-center">
                                        <span className="text-primary text-3xl font-bold">
                                            {initials || <UserIcon className="size-10" />}
                                        </span>
                                    </div>
                                )}
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{a.name || "Agent"}</CardTitle>
                                    {a.position && (
                                        <p className="text-muted-foreground text-sm">{a.position}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-1 space-y-2 pt-0">
                                    {a.location && (
                                        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                            <MapPinIcon className="size-3.5 shrink-0" />
                                            {a.location}
                                        </p>
                                    )}
                                    {a.mobile && (
                                        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                            <PhoneIcon className="size-3.5 shrink-0" />
                                            {a.mobile}
                                        </p>
                                    )}
                                    {a.email && (
                                        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                            <MailIcon className="size-3.5 shrink-0" />
                                            <span className="truncate">{a.email}</span>
                                        </p>
                                    )}
                                </CardContent>
                                <CardFooter className="mt-auto border-t px-4 py-4">
                                    <div className="flex w-full flex-col gap-3">
                                        {a.rating ? (
                                            <div className="space-y-1">
                                                <StarRating value={a.rating.rating} readonly size="sm" />
                                                <p className="text-muted-foreground text-xs">
                                                    Rating submitted
                                                </p>
                                            </div>
                                        ) : a.canRate ? (
                                            <p className="text-muted-foreground text-xs">
                                                You can rate this agent once.
                                            </p>
                                        ) : (
                                            <p className="text-muted-foreground text-sm">
                                                Rating unavailable
                                            </p>
                                        )}
                                        {a.rating || a.canRate ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={a.rating ? "outline" : "default"}
                                                className="w-full"
                                                onClick={() => setRatingAgentId(a.id)}
                                            >
                                                {a.rating ? "Your rating" : "Rate agent"}
                                            </Button>
                                        ) : null}
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            {ratingAgent ? (
                <AgentRatingDialog
                    key={ratingAgent.id}
                    agent={ratingAgent}
                    open
                    onOpenChange={(open) => {
                        if (!open) setRatingAgentId(null);
                    }}
                />
            ) : null}
        </div>
    );
};

export default ClientMyAgent;
