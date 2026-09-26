import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminResourceApi } from "@/db/api/admin.api";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
    OverallLeaderboardAgent,
    TopRatedLeaderboardAgent,
    TopReferralsLeaderboardAgent,
} from "@/types/leaderboard";
import { useQuery } from "@tanstack/react-query";
import { StarIcon, TrophyIcon, UsersIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

type LeaderboardView = "monthly" | "yearly" | "top-rated" | "top-referrals";

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

const safeNumber = (value: number): number => (
    Number.isFinite(value) ? value : 0
);

const formatCount = (value: number): string => (
    numberFormatter.format(safeNumber(value))
);

const formatDecimal = (value: number): string => (
    safeNumber(value).toFixed(2)
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

const RankBadge = ({ rank }: { rank: number }) => {
    const rankClass = rank === 1
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
        : rank === 2
            ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100"
            : rank === 3
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200"
                : "bg-muted text-muted-foreground";

    return (
        <span
            aria-label={`Rank ${rank}`}
            className={`inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-bold tabular-nums ${rankClass}`}
        >
            {rank}
        </span>
    );
};

const LeaderboardLoading = ({ columns }: { columns: number }) => (
    <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, rowIndex) => (
            <div
                key={rowIndex}
                className="flex min-w-[560px] items-center gap-5 border-b px-2 py-3 last:border-0"
            >
                {Array.from({ length: columns }).map((__, columnIndex) => (
                    <Skeleton
                        key={columnIndex}
                        className={columnIndex === 1 ? "h-4 w-36" : "h-4 w-14"}
                    />
                ))}
            </div>
        ))}
    </div>
);

type LeaderboardPanelProps = {
    title: string;
    description: string;
    isPending: boolean;
    error: unknown;
    isEmpty: boolean;
    columns: number;
    onRetry: () => void;
    children: ReactNode;
};

const LeaderboardPanel = ({
    title,
    description,
    isPending,
    error,
    isEmpty,
    columns,
    onRetry,
    children,
}: LeaderboardPanelProps) => (
    <Card className="min-w-0 overflow-hidden border-border/80 py-0 shadow-sm">
        <CardHeader className="border-b py-5">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 px-0">
            {isPending ? (
                <div className="overflow-x-auto p-4">
                    <LeaderboardLoading columns={columns} />
                </div>
            ) : error ? (
                <div className="flex flex-col items-start gap-3 p-6">
                    <p className="text-destructive text-sm">{getApiErrorMessage(error)}</p>
                    <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                        Try again
                    </Button>
                </div>
            ) : isEmpty ? (
                <div className="flex flex-col items-center px-6 py-14 text-center">
                    <div className="bg-muted flex size-12 items-center justify-center rounded-xl">
                        <UsersIcon className="text-muted-foreground size-6" />
                    </div>
                    <p className="mt-3 font-medium">No leaderboard entries yet</p>
                    <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                        Agent performance will appear here when records are available for this period.
                    </p>
                </div>
            ) : children}
        </CardContent>
    </Card>
);

const OverallTable = ({ agents }: { agents: OverallLeaderboardAgent[] }) => (
    <Table className="min-w-[920px]">
        <TableCaption className="sr-only">Overall agent leaderboard</TableCaption>
        <TableHeader>
            <TableRow className="bg-muted/40">
                <TableHead className="w-16 pl-5">Rank</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Reservations</TableHead>
                <TableHead className="text-right">Appointments</TableHead>
                <TableHead className="text-right">Referrals</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="pr-5 text-right">Score</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {agents.map((agent) => (
                <TableRow key={agent.agent_id}>
                    <TableCell className="pl-5"><RankBadge rank={agent.rank} /></TableCell>
                    <TableCell className="max-w-[220px] font-medium">
                        <span className="block truncate">{agent.agent_name || "Unknown Agent"}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(agent.sales)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(agent.reservations)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(agent.appointments)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(agent.referrals)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                        <span className="inline-flex items-center justify-end gap-1">
                            <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
                            {formatDecimal(agent.rating)}
                        </span>
                    </TableCell>
                    <TableCell className="pr-5 text-right font-semibold tabular-nums">
                        {formatDecimal(agent.score)}
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const TopRatedTable = ({ agents }: { agents: TopRatedLeaderboardAgent[] }) => (
    <Table className="min-w-[560px]">
        <TableCaption className="sr-only">Top-rated agent leaderboard</TableCaption>
        <TableHeader>
            <TableRow className="bg-muted/40">
                <TableHead className="w-16 pl-5">Rank</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="pr-5 text-right">Rating Count</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {agents.map((agent) => (
                <TableRow key={agent.agent_id}>
                    <TableCell className="pl-5"><RankBadge rank={agent.rank} /></TableCell>
                    <TableCell className="max-w-[260px] font-medium">
                        <span className="block truncate">{agent.agent_name || "Unknown Agent"}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                        <span className="inline-flex items-center justify-end gap-1">
                            <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
                            {formatDecimal(agent.rating)}
                        </span>
                    </TableCell>
                    <TableCell className="pr-5 text-right tabular-nums">
                        {formatCount(agent.rating_count)}
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const TopReferralsTable = ({ agents }: { agents: TopReferralsLeaderboardAgent[] }) => (
    <Table className="min-w-[480px]">
        <TableCaption className="sr-only">Top-referral agent leaderboard</TableCaption>
        <TableHeader>
            <TableRow className="bg-muted/40">
                <TableHead className="w-16 pl-5">Rank</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="pr-5 text-right">Referrals</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {agents.map((agent) => (
                <TableRow key={agent.agent_id}>
                    <TableCell className="pl-5"><RankBadge rank={agent.rank} /></TableCell>
                    <TableCell className="max-w-[300px] font-medium">
                        <span className="block truncate">{agent.agent_name || "Unknown Agent"}</span>
                    </TableCell>
                    <TableCell className="pr-5 text-right font-semibold tabular-nums">
                        {formatCount(agent.referrals)}
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const AdminLeaderboardsPage = () => {
    const [activeView, setActiveView] = useState<LeaderboardView>("monthly");

    const monthlyQuery = useQuery({
        queryKey: ["admin", "leaderboard", "monthly"],
        queryFn: () => adminResourceApi.monthlyLeaderboard(),
        enabled: activeView === "monthly",
        refetchInterval: 2_000,
    });
    const yearlyQuery = useQuery({
        queryKey: ["admin", "leaderboard", "yearly"],
        queryFn: () => adminResourceApi.yearlyLeaderboard(),
        enabled: activeView === "yearly",
        refetchInterval: 2_000,
    });
    const topRatedQuery = useQuery({
        queryKey: ["admin", "leaderboard", "top-rated"],
        queryFn: () => adminResourceApi.topRatedLeaderboard(),
        enabled: activeView === "top-rated",
        refetchInterval: 2_000,
    });
    const topReferralsQuery = useQuery({
        queryKey: ["admin", "leaderboard", "top-referrals"],
        queryFn: () => adminResourceApi.topReferralsLeaderboard(),
        enabled: activeView === "top-referrals",
        refetchInterval: 2_000,
    });

    const monthlyAgents = monthlyQuery.data?.data.agents ?? [];
    const yearlyAgents = yearlyQuery.data?.data.agents ?? [];
    const topRatedAgents = topRatedQuery.data?.data.agents ?? [];
    const topReferralAgents = topReferralsQuery.data?.data.agents ?? [];

    return (
        <div className="min-w-0 space-y-6">
            <ScreenBackLink to="/admin" label="Dashboard" hideFrom="md" />

            <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <TrophyIcon className="size-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Leaderboards</h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                        Review AFFORDAHOMES agent performance using the rankings calculated by Core.
                    </p>
                </div>
            </div>

            <Tabs
                value={activeView}
                onValueChange={(value) => setActiveView(value as LeaderboardView)}
            >
                <div className="max-w-full overflow-x-auto pb-1">
                    <TabsList className="w-max min-w-full justify-start">
                        <TabsTrigger value="monthly">Monthly Overall</TabsTrigger>
                        <TabsTrigger value="yearly">Yearly Overall</TabsTrigger>
                        <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
                        <TabsTrigger value="top-referrals">Top Referrals</TabsTrigger>
                    </TabsList>
                </div>

                {activeView === "monthly" && (
                    <TabsContent value="monthly" className="mt-5">
                        <LeaderboardPanel
                            title="Monthly Overall"
                            description={monthPeriodLabel(
                                monthlyQuery.data?.data.month,
                                monthlyQuery.data?.data.year,
                            )}
                            isPending={monthlyQuery.isPending}
                            error={monthlyQuery.error}
                            isEmpty={monthlyAgents.length === 0}
                            columns={8}
                            onRetry={() => void monthlyQuery.refetch()}
                        >
                            <OverallTable agents={monthlyAgents} />
                        </LeaderboardPanel>
                    </TabsContent>
                )}

                {activeView === "yearly" && (
                    <TabsContent value="yearly" className="mt-5">
                        <LeaderboardPanel
                            title="Yearly Overall"
                            description={yearPeriodLabel(yearlyQuery.data?.data.year)}
                            isPending={yearlyQuery.isPending}
                            error={yearlyQuery.error}
                            isEmpty={yearlyAgents.length === 0}
                            columns={8}
                            onRetry={() => void yearlyQuery.refetch()}
                        >
                            <OverallTable agents={yearlyAgents} />
                        </LeaderboardPanel>
                    </TabsContent>
                )}

                {activeView === "top-rated" && (
                    <TabsContent value="top-rated" className="mt-5">
                        <LeaderboardPanel
                            title="Top Rated"
                            description={yearPeriodLabel(topRatedQuery.data?.data.year)}
                            isPending={topRatedQuery.isPending}
                            error={topRatedQuery.error}
                            isEmpty={topRatedAgents.length === 0}
                            columns={4}
                            onRetry={() => void topRatedQuery.refetch()}
                        >
                            <TopRatedTable agents={topRatedAgents} />
                        </LeaderboardPanel>
                    </TabsContent>
                )}

                {activeView === "top-referrals" && (
                    <TabsContent value="top-referrals" className="mt-5">
                        <LeaderboardPanel
                            title="Top Referrals"
                            description={yearPeriodLabel(topReferralsQuery.data?.data.year)}
                            isPending={topReferralsQuery.isPending}
                            error={topReferralsQuery.error}
                            isEmpty={topReferralAgents.length === 0}
                            columns={3}
                            onRetry={() => void topReferralsQuery.refetch()}
                        >
                            <TopReferralsTable agents={topReferralAgents} />
                        </LeaderboardPanel>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default AdminLeaderboardsPage;
