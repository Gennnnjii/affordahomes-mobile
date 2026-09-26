import { agentPortalApi } from "@/db/api/agent.portal.api";
import { asRecord, str } from "@/lib/record";
import { useAgentAuth } from "@/db/queries/useAgentAuth";
import { userInitials } from "@/lib/userInitials";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { getApiErrorMessage } from "@/lib/api-error";
import { useQuery } from "@tanstack/react-query";
import {
    CopyIcon,
    LinkIcon,
    MailIcon,
    MousePointerClickIcon,
    Share2Icon,
    StarIcon,
    UserIcon,
    UserPlusIcon,
} from "lucide-react";
import { toast } from "sonner";

const AgentProfilePage = () => {
    const { sessionQuery } = useAgentAuth();
    const u = sessionQuery.data?.data;

    const fullName = u ? `${u.f_} ${u.l_}`.trim() : "—";
    const initials = userInitials(u?.f_, u?.l_, u?.e_);

    const { data: ratingsData } = useQuery({
        queryKey: ["agent", "ratings-summary"],
        queryFn: () => agentPortalApi.getMyRatingSummary(),
    });
    const referralQuery = useQuery({
        queryKey: ["agent", "referral"],
        queryFn: () => agentPortalApi.referral(),
        refetchInterval: 2_000,
        retry: false,
    });
    const rd = ratingsData?.data ?? { average: null, count: 0, distribution: {}, recent: [] };
    const distribution = rd.distribution as Record<string, number>;
    const recent = (rd.recent as unknown[]).map((r) => asRecord(r as Record<string, unknown>));
    const referral = referralQuery.data?.data;

    const copyReferralLink = async () => {
        if (!referral?.referral_link) return;

        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error("Clipboard access is unavailable.");
            }

            await navigator.clipboard.writeText(referral.referral_link);
            toast.success("Referral link copied.");
        } catch {
            toast.error("Could not copy the referral link. Please try again.");
        }
    };

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/agent" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
                <p className="text-muted-foreground mt-1 text-sm">Your agent account information.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

                <Card className="border-border/80 lg:self-start">
                    <CardContent className="flex flex-col items-center gap-4 pb-8 pt-8">
                        <div className="bg-indigo-700 text-white flex size-20 items-center justify-center rounded-full text-2xl font-semibold">
                            {initials}
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-semibold">{fullName}</p>
                            <p className="text-muted-foreground text-sm">{u?.e_ ?? "—"}</p>
                        </div>
                        <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-800">
                            Agent
                        </span>
                    </CardContent>
                </Card>

                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle>Account details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex items-start gap-3">
                            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                <UserIcon className="text-muted-foreground size-4" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                    Full name
                                </p>
                                <p className="mt-0.5 font-medium">{fullName}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                <MailIcon className="text-muted-foreground size-4" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                    Email address
                                </p>
                                <p className="mt-0.5 font-medium">{u?.e_ ?? "—"}</p>
                            </div>
                        </div>

                        <Separator />

                        <p className="text-muted-foreground text-xs">
                            To update your account details, please contact your administrator.
                        </p>
                    </CardContent>
                </Card>

                {/* ── Referral summary ── */}
                <Card className="border-border/80 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Share2Icon className="text-primary size-4" />
                            Referral
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {referralQuery.isPending ? (
                            <div className="space-y-4" role="status">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-10 w-full" />
                                <div className="grid grid-cols-2 gap-3">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            </div>
                        ) : referralQuery.isError || !referral ? (
                            <div className="space-y-3">
                                <p className="text-destructive text-sm" role="alert">
                                    {referralQuery.error
                                        ? getApiErrorMessage(referralQuery.error)
                                        : "Referral information is unavailable."}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void referralQuery.refetch()}
                                >
                                    Try again
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                                    <div className="min-w-0 space-y-3">
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Referral code
                                            </p>
                                            <p className="mt-1 break-all font-mono text-sm font-semibold">
                                                {referral.referral_code}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                                                <LinkIcon className="size-3.5" aria-hidden="true" />
                                                Shareable link
                                            </p>
                                            <p className="text-muted-foreground mt-1 break-all text-sm">
                                                {referral.referral_link}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        className="w-full md:w-auto"
                                        onClick={() => void copyReferralLink()}
                                    >
                                        <CopyIcon aria-hidden="true" />
                                        Copy Referral Link
                                    </Button>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted/40 rounded-lg p-4">
                                        <MousePointerClickIcon
                                            className="text-muted-foreground size-4"
                                            aria-hidden="true"
                                        />
                                        <p className="mt-3 text-2xl font-semibold">
                                            {referral.clicks}
                                        </p>
                                        <p className="text-muted-foreground text-xs">Clicks</p>
                                    </div>
                                    <div className="bg-muted/40 rounded-lg p-4">
                                        <UserPlusIcon
                                            className="text-muted-foreground size-4"
                                            aria-hidden="true"
                                        />
                                        <p className="mt-3 text-2xl font-semibold">
                                            {referral.registrations}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            Registrations
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <StarIcon className="text-amber-500 size-4" />
                            Client ratings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {rd.count === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No ratings yet. Ratings appear after a client has completed their experience.
                            </p>
                        ) : (
                            <>
                                {/* Average */}
                                <div className="flex items-center gap-4">
                                    <span className="text-5xl font-bold tracking-tight">
                                        {rd.average !== null ? rd.average : "—"}
                                    </span>
                                    <div className="space-y-1">
                                        <StarRating
                                            value={Math.round(rd.average ?? 0)}
                                            readonly
                                            size="lg"
                                        />
                                        <p className="text-muted-foreground text-sm">
                                            {rd.count} {rd.count === 1 ? "rating" : "ratings"}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Distribution */}
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = distribution[String(star)] ?? 0;
                                        const pct = rd.count > 0 ? Math.round((count / rd.count) * 100) : 0;
                                        return (
                                            <div key={star} className="flex items-center gap-3 text-sm">
                                                <span className="w-4 text-right text-muted-foreground">{star}</span>
                                                <div className="flex-1 overflow-hidden rounded-full bg-muted h-2">
                                                    <div
                                                        className="h-2 rounded-full bg-amber-400 transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="w-8 text-right text-muted-foreground">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Recent comments */}
                                {recent.length > 0 && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium">Recent comments</p>
                                            {recent.map((r) => {
                                                const client = asRecord(r.client as Record<string, unknown>);
                                                const clientName = `${str(client.first_name) ?? ""} ${str(client.last_name) ?? ""}`.trim() || "Anonymous";
                                                return (
                                                    <div key={str(r.id)} className="space-y-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm font-medium">{clientName}</span>
                                                            <StarRating
                                                                value={Number(r.rating) || 0}
                                                                readonly
                                                                size="sm"
                                                            />
                                                        </div>
                                                        <p className="text-muted-foreground text-sm italic">
                                                            "{str(r.comment)}"
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AgentProfilePage;
