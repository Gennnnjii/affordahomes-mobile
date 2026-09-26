import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { clientPortalApi } from "@/db/api/client.portal.api";
import { getApiErrorMessage } from "@/lib/api-error";
import {
    formatOpenHouseDate,
    formatOpenHouseRegisteredAt,
    formatOpenHouseTimeRange,
} from "@/lib/open-house";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { CalendarDaysIcon, ClockIcon, MapPinIcon, TicketCheckIcon } from "lucide-react";

const DetailSkeleton = () => (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-border/80 shadow-sm">
            <CardHeader><Skeleton className="h-7 w-2/3" /></CardHeader>
            <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-5 w-full" />
                ))}
            </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
            <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
            </CardContent>
        </Card>
    </div>
);

const responseStatus = (error: unknown): number | undefined =>
    (error as { response?: { status?: number } })?.response?.status;

const ClientOpenHouseRegistrationDetail = () => {
    const { registrationId } = useParams({ strict: false }) as { registrationId: string };
    const registrationQuery = useQuery({
        queryKey: ["client", "open-house", "registration", registrationId],
        queryFn: () => clientPortalApi.openHouseRegistration(registrationId),
        refetchInterval: 2_000,
        enabled: Boolean(registrationId),
    });

    const registration = registrationQuery.data?.data;
    const event = registration?.event;
    const isNotFound = registrationQuery.isError && responseStatus(registrationQuery.error) === 404;

    return (
        <div className="space-y-6">
            <ScreenBackLink
                to="/dashboard/open-house/registrations"
                label="My Open House Registrations"
                hideFrom="md"
            />

            {registrationQuery.isPending ? (
                <DetailSkeleton />
            ) : registrationQuery.isError || !registration ? (
                <Card className="border-destructive/30 shadow-sm">
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-medium">
                                {isNotFound
                                    ? "Open House registration not found."
                                    : "This registration could not be loaded."}
                            </p>
                            {!isNotFound && registrationQuery.isError ? (
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {getApiErrorMessage(registrationQuery.error)}
                                </p>
                            ) : (
                                <p className="text-muted-foreground mt-1 text-sm">
                                    It may not exist or may not belong to your account.
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button variant="outline" asChild>
                                <Link to="/dashboard/open-house/registrations">
                                    Return to registrations
                                </Link>
                            </Button>
                            {!isNotFound && registrationQuery.isError ? (
                                <Button
                                    type="button"
                                    onClick={() => void registrationQuery.refetch()}
                                >
                                    Try again
                                </Button>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <Card className="border-border/80 min-w-0 shadow-sm">
                        <CardHeader className="min-w-0 gap-3">
                            <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 w-fit rounded-md px-2.5 py-1 text-xs font-semibold capitalize">
                                {registration.status}
                            </span>
                            <h1 className="break-words text-2xl font-semibold leading-tight">
                                {event?.title ?? "Open House registration"}
                            </h1>
                            {event?.project?.trim() ? (
                                <p className="text-muted-foreground break-words text-sm">
                                    {event.project.trim()}
                                </p>
                            ) : null}
                        </CardHeader>
                        <CardContent className="min-w-0 space-y-5">
                            <Separator />
                            {event ? (
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                            <CalendarDaysIcon className="text-muted-foreground size-4" />
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Event date
                                            </p>
                                            <p className="mt-1 font-medium">
                                                {formatOpenHouseDate(event.event_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                            <ClockIcon className="text-muted-foreground size-4" />
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Event time
                                            </p>
                                            <p className="mt-1 font-medium">
                                                {formatOpenHouseTimeRange(
                                                    event.start_time,
                                                    event.end_time,
                                                )}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                Philippine time
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 sm:col-span-2">
                                        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                            <MapPinIcon className="text-muted-foreground size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Location
                                            </p>
                                            <p className="mt-1 break-words font-medium">
                                                {event.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    Event information is unavailable.
                                </p>
                            )}

                            <Separator />
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Property interest
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                                        {registration.property_interest?.trim() || "Not provided"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Registered
                                    </p>
                                    <p className="mt-1 text-sm font-medium">
                                        {formatOpenHouseRegisteredAt(registration.registered_at)}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Remarks
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-7">
                                        {registration.remarks?.trim() || "No remarks provided"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80 min-w-0 self-start shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TicketCheckIcon className="text-primary size-5" />
                                Registration details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                    Reference
                                </p>
                                <p className="mt-1 break-all font-mono text-sm">{registration.id}</p>
                            </div>
                            {event ? (
                                <Button variant="outline" className="w-full" asChild>
                                    <Link
                                        to="/dashboard/open-house/$eventId"
                                        params={{ eventId: event.id }}
                                    >
                                        View Open House
                                    </Link>
                                </Button>
                            ) : null}
                            <Button variant="ghost" className="w-full" asChild>
                                <Link to="/dashboard/open-house/registrations">
                                    Back to registrations
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ClientOpenHouseRegistrationDetail;
