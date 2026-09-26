import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Link } from "@tanstack/react-router";
import { CalendarDaysIcon, ClockIcon, MapPinIcon } from "lucide-react";

const RegistrationCardSkeleton = () => (
    <Card className="border-border/80 gap-5 shadow-sm">
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-9 w-full" />
        </CardFooter>
    </Card>
);

const ClientOpenHouseRegistrations = () => {
    const registrationsQuery = useQuery({
        queryKey: ["client", "open-house", "registrations"],
        queryFn: () => clientPortalApi.openHouseRegistrations(),
        refetchInterval: 2_000,
    });

    const registrations = registrationsQuery.data?.data ?? [];

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/open-house" label="Open House" hideFrom="md" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight">My Open House Registrations</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Review your AFFORDAHOMES event registrations and visit details.
                    </p>
                </div>
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                    <Link to="/dashboard/open-house">Browse events</Link>
                </Button>
            </div>

            {registrationsQuery.isPending ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <RegistrationCardSkeleton key={index} />
                    ))}
                </div>
            ) : registrationsQuery.isError ? (
                <Card className="border-destructive/30 shadow-sm">
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-medium">Your registrations could not be loaded.</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {getApiErrorMessage(registrationsQuery.error)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => void registrationsQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            ) : registrations.length === 0 ? (
                <Card className="border-border/80 shadow-sm">
                    <CardContent className="py-6 text-center">
                        <CalendarDaysIcon className="text-muted-foreground mx-auto size-10" />
                        <p className="mt-4 font-medium">No Open House registrations yet</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Browse available events and register when you find one that interests you.
                        </p>
                        <Button className="mt-5 w-full sm:w-auto" asChild>
                            <Link to="/dashboard/open-house">Browse Open House events</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {registrations.map((registration) => {
                        const event = registration.event;
                        return (
                            <Card
                                key={registration.id}
                                className="border-border/80 min-w-0 gap-5 shadow-sm"
                            >
                                <CardHeader className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-md px-2 py-0.5 text-xs font-medium capitalize">
                                            {registration.status}
                                        </span>
                                    </div>
                                    <CardTitle className="break-words text-lg leading-snug">
                                        {event?.title ?? "Open House event"}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="min-w-0 flex-1 space-y-3 text-sm">
                                    {event ? (
                                        <>
                                            <div className="flex items-start gap-2">
                                                <CalendarDaysIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                                <span>{formatOpenHouseDate(event.event_date)}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <ClockIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                                <span>
                                                    {formatOpenHouseTimeRange(
                                                        event.start_time,
                                                        event.end_time,
                                                    )}
                                                    <span className="text-muted-foreground">
                                                        {" "}· Philippine time
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPinIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                                <span className="min-w-0 break-words">{event.location}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground">
                                            Event information is unavailable.
                                        </p>
                                    )}

                                    {registration.property_interest?.trim() ? (
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Property interest
                                            </p>
                                            <p className="mt-1 break-words">
                                                {registration.property_interest.trim()}
                                            </p>
                                        </div>
                                    ) : null}

                                    <p className="text-muted-foreground text-xs">
                                        Registered {formatOpenHouseRegisteredAt(registration.registered_at)}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link
                                            to="/dashboard/open-house/registrations/$registrationId"
                                            params={{ registrationId: registration.id }}
                                        >
                                            View details
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ClientOpenHouseRegistrations;
