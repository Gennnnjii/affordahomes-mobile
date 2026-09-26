import { LandingChrome } from "@/components/layout/LandingChrome";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { publicApi } from "@/db/api/public.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { asRecord, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import type { PublicLeaderboardAgent } from "@/types/leaderboard";
import { useQuery } from "@tanstack/react-query";
import {
    MailIcon,
    MapPinIcon,
    PhoneIcon,
    RefreshCwIcon,
    StarIcon,
    TrophyIcon,
    UserRoundIcon,
} from "lucide-react";
import { useState } from "react";

type LeaderboardPeriod = "monthly" | "yearly";

const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const numberFormatter = new Intl.NumberFormat("en-PH");

const formatSales = (sales: number): string => (
    Number.isFinite(sales) ? numberFormatter.format(sales) : "—"
);

const formatRating = (rating: number): string => (
    Number.isFinite(rating) ? rating.toFixed(2) : "—"
);

const monthPeriodLabel = (month: number | undefined, year: number | undefined): string => {
    const monthName = month && month >= 1 && month <= 12
        ? MONTH_NAMES[month - 1]
        : "Current month";
    return year ? `${monthName} ${year}` : monthName;
};

const yearPeriodLabel = (year: number | undefined): string => (
    year ? String(year) : "Current year"
);

const rankAccent = (rank: number): string => {
    if (rank === 1) {
        return "border-amber-300/80 bg-amber-50/50 dark:border-amber-700/70 dark:bg-amber-950/20";
    }
    if (rank === 2) {
        return "border-slate-300/80 bg-slate-50/60 dark:border-slate-600 dark:bg-slate-900/30";
    }
    if (rank === 3) {
        return "border-orange-300/80 bg-orange-50/50 dark:border-orange-700/70 dark:bg-orange-950/20";
    }
    return "border-border/80";
};

const rankBadgeAccent = (rank: number): string => {
    if (rank === 1) {
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200";
    }
    if (rank === 2) {
        return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100";
    }
    if (rank === 3) {
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200";
    }
    return "bg-muted text-muted-foreground";
};

const AgentSkeleton = () => (
    <Card className="border-border/80 overflow-hidden rounded-xl p-0 shadow-sm">
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-28" />
            <div className="space-y-2 pt-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="mt-1 h-9 w-full" />
        </div>
    </Card>
);

const TopAgentsSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="gap-4 border-border/80 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-7 w-16 rounded-full" />
                    <Skeleton className="size-5" />
                </div>
                <Skeleton className="h-6 w-40" />
                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </Card>
        ))}
    </div>
);

const TopAgentCards = ({ agents }: { agents: PublicLeaderboardAgent[] }) => (
    <div role="list" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
            <Card
                key={agent.agent_id}
                role="listitem"
                className={`gap-4 overflow-hidden p-5 shadow-sm ${rankAccent(agent.rank)}`}
            >
                <div className="flex items-center justify-between gap-4">
                    <span
                        aria-label={`Rank ${agent.rank}`}
                        className={`inline-flex min-w-16 items-center justify-center rounded-full px-3 py-1 text-xs font-bold tabular-nums ${rankBadgeAccent(agent.rank)}`}
                    >
                        Rank {agent.rank}
                    </span>
                    {agent.rank <= 3 && (
                        <TrophyIcon className="size-5 text-amber-500" aria-hidden="true" />
                    )}
                </div>

                <h3 className="truncate text-lg font-semibold" title={agent.agent_name}>
                    {agent.agent_name || "Agent"}
                </h3>

                <dl className="grid grid-cols-2 gap-3">
                    <div className="bg-background/75 rounded-lg border p-3">
                        <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                            Sales
                        </dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums">
                            {formatSales(agent.sales)}
                        </dd>
                    </div>
                    <div className="bg-background/75 rounded-lg border p-3">
                        <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                            Rating
                        </dt>
                        <dd className="mt-1 inline-flex items-center gap-1 text-lg font-semibold tabular-nums">
                            <StarIcon
                                className="size-4 fill-amber-400 text-amber-400"
                                aria-hidden="true"
                            />
                            {formatRating(agent.rating)}
                        </dd>
                    </div>
                </dl>
            </Card>
        ))}
    </div>
);

type TopAgentsPanelProps = {
    agents: PublicLeaderboardAgent[];
    periodLabel: string;
    isPending: boolean;
    isError: boolean;
    error: unknown;
    onRetry: () => void;
};

const TopAgentsPanel = ({
    agents,
    periodLabel,
    isPending,
    isError,
    error,
    onRetry,
}: TopAgentsPanelProps) => (
    <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
            Ranking period: <span className="text-foreground font-medium">{periodLabel}</span>
        </p>

        {isPending ? (
            <TopAgentsSkeleton />
        ) : isError ? (
            <Card className="items-start gap-3 border-destructive/30 p-5">
                <p className="text-destructive text-sm">{getApiErrorMessage(error)}</p>
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCwIcon className="size-4" aria-hidden="true" />
                    Retry
                </Button>
            </Card>
        ) : agents.length === 0 ? (
            <Card className="items-center gap-2 border-border/80 px-6 py-12 text-center">
                <TrophyIcon className="text-muted-foreground size-8" aria-hidden="true" />
                <p className="font-medium">No leaderboard entries yet</p>
                <p className="text-muted-foreground max-w-md text-sm">
                    Top agents will appear here when performance records are available for this period.
                </p>
            </Card>
        ) : (
            <TopAgentCards agents={agents} />
        )}
    </div>
);

const LandingAgents = () => {
    const [activeLeaderboard, setActiveLeaderboard] = useState<LeaderboardPeriod>("monthly");

    const agentsQuery = useQuery({
        queryKey: ["public", "agents"],
        queryFn: () => publicApi.agents(),
        refetchInterval: 2_000,
    });
    const monthlyLeaderboardQuery = useQuery({
        queryKey: ["public", "leaderboard", "monthly"],
        queryFn: () => publicApi.monthlyLeaderboard(),
        enabled: activeLeaderboard === "monthly",
        refetchInterval: 2_000,
    });
    const yearlyLeaderboardQuery = useQuery({
        queryKey: ["public", "leaderboard", "yearly"],
        queryFn: () => publicApi.yearlyLeaderboard(),
        enabled: activeLeaderboard === "yearly",
        refetchInterval: 2_000,
    });

    const rows = (agentsQuery.data?.data as unknown[]) ?? [];
    const monthlyAgents = monthlyLeaderboardQuery.data?.data.agents ?? [];
    const yearlyAgents = yearlyLeaderboardQuery.data?.data.agents ?? [];

    return (
        <LandingChrome>
            <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 md:px-12 lg:px-14">
                <ScreenBackLink to="/" label="Home" />

                <section aria-labelledby="top-agents-heading" className="space-y-6">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                            <TrophyIcon className="size-5" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 id="top-agents-heading" className="text-3xl font-semibold tracking-tight">
                                Top Agents
                            </h1>
                            <p className="text-muted-foreground mt-2 max-w-2xl">
                                Meet leading AFFORDAHOMES agents ranked by completed sales, with client
                                ratings shown for the selected period.
                            </p>
                        </div>
                    </div>

                    <Tabs
                        value={activeLeaderboard}
                        onValueChange={(value) => setActiveLeaderboard(value as LeaderboardPeriod)}
                    >
                        <TabsList
                            className="grid w-full grid-cols-2 sm:w-auto"
                            aria-label="Top Agents ranking period"
                        >
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="yearly">Yearly</TabsTrigger>
                        </TabsList>

                        <TabsContent value="monthly" className="mt-5">
                            <TopAgentsPanel
                                agents={monthlyAgents}
                                periodLabel={monthPeriodLabel(
                                    monthlyLeaderboardQuery.data?.data.month,
                                    monthlyLeaderboardQuery.data?.data.year,
                                )}
                                isPending={monthlyLeaderboardQuery.isPending}
                                isError={monthlyLeaderboardQuery.isError}
                                error={monthlyLeaderboardQuery.error}
                                onRetry={() => void monthlyLeaderboardQuery.refetch()}
                            />
                        </TabsContent>

                        <TabsContent value="yearly" className="mt-5">
                            <TopAgentsPanel
                                agents={yearlyAgents}
                                periodLabel={yearPeriodLabel(
                                    yearlyLeaderboardQuery.data?.data.year,
                                )}
                                isPending={yearlyLeaderboardQuery.isPending}
                                isError={yearlyLeaderboardQuery.isError}
                                error={yearlyLeaderboardQuery.error}
                                onRetry={() => void yearlyLeaderboardQuery.refetch()}
                            />
                        </TabsContent>
                    </Tabs>
                </section>

                <section aria-labelledby="agent-directory-heading" className="space-y-8">
                    <div>
                        <h2 id="agent-directory-heading" className="text-3xl font-semibold tracking-tight">
                            Our agents
                        </h2>
                        <p className="text-muted-foreground mt-2">
                            Connect with a licensed professional ready to guide you home.
                        </p>
                    </div>

                    {agentsQuery.isPending ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <AgentSkeleton key={i} />
                            ))}
                        </div>
                    ) : agentsQuery.isError ? (
                        <p className="text-destructive">Could not load agents.</p>
                    ) : rows.length === 0 ? (
                        <p className="text-muted-foreground py-16 text-center text-sm">
                            No agents available at this time.
                        </p>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {rows.map((raw) => {
                                const a = asRecord(raw);
                                const id = str(a.id) ?? "";
                                const firstName = str(a.first_name) ?? "";
                                const lastName = str(a.last_name) ?? "";
                                const name = `${firstName} ${lastName}`.trim() || "Agent";
                                const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                                const photoSrc = publicStorageUrl(str(a.profile_picture));
                                const position = str(a.position);
                                const agentLocation = str(a.location);
                                const mobile = str(a.mobile);
                                const email = str(a.email);
                                const description = str(a.description);

                                return (
                                    <Card key={id} className="border-border/80 overflow-hidden rounded-xl p-0 shadow-sm">

                                        <div className="bg-muted aspect-square w-full overflow-hidden">
                                            {photoSrc ? (
                                                <img
                                                    src={photoSrc}
                                                    alt={name}
                                                    className="size-full object-cover object-top"
                                                />
                                            ) : (
                                                <div className="text-primary/40 flex size-full items-center justify-center bg-primary/8">
                                                    {initials ? (
                                                        <span className="text-5xl font-semibold tracking-tight">
                                                            {initials}
                                                        </span>
                                                    ) : (
                                                        <UserRoundIcon className="size-20" strokeWidth={1} />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3 p-5">
                                            <div>
                                                <h3 className="text-lg font-bold leading-snug">{name}</h3>
                                                {position && (
                                                    <p className="text-primary mt-0.5 text-sm font-semibold">
                                                        {position}
                                                    </p>
                                                )}
                                            </div>

                                            {(agentLocation || mobile || email) && (
                                                <div className="text-muted-foreground space-y-1.5 text-sm">
                                                    {agentLocation && (
                                                        <p className="flex items-center gap-2">
                                                            <MapPinIcon className="text-primary size-4 shrink-0" />
                                                            {agentLocation}
                                                        </p>
                                                    )}
                                                    {mobile && (
                                                        <p className="flex items-center gap-2">
                                                            <PhoneIcon className="text-primary size-4 shrink-0" />
                                                            {mobile}
                                                        </p>
                                                    )}
                                                    {email && (
                                                        <p className="flex items-center gap-2">
                                                            <MailIcon className="text-primary size-4 shrink-0" />
                                                            {email}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {description && (
                                                <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                                                    {description}
                                                </p>
                                            )}

                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </LandingChrome>
    );
};

export default LandingAgents;
