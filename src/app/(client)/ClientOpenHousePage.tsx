import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { publicApi } from "@/db/api/public.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatOpenHouseDate, formatOpenHouseTimeRange } from "@/lib/open-house";
import { cn } from "@/lib/utils";
import type { OpenHouseEvent } from "@/types/open-house";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarDaysIcon, ClockIcon, MapPinIcon, UsersRoundIcon } from "lucide-react";

const statusStyles: Record<OpenHouseEvent["status"], string> = {
    upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    ongoing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const getAvailability = (event: OpenHouseEvent) => {
    if (event.registration_open) {
        return {
            label: "Registration open",
            className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        };
    }
    if (event.remaining_slots === 0) {
        return {
            label: "Full",
            className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        };
    }
    if (event.status === "ongoing") {
        return {
            label: "Ongoing — registration closed",
            className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        };
    }
    return {
        label: "Registration closed",
        className: "bg-muted text-muted-foreground",
    };
};

const EventCardSkeleton = () => (
    <Card className="border-border/80 gap-5 shadow-sm">
        <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
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

const ClientOpenHousePage = () => {
    const eventsQuery = useQuery({
        queryKey: ["public", "open-house"],
        queryFn: () => publicApi.openHouseEvents(),
        refetchInterval: 2_000,
    });

    const events = eventsQuery.data?.data ?? [];

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight">Open House</h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                        Discover upcoming AFFORDAHOMES events and reserve your place for a visit.
                    </p>
                </div>
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                    <Link to="/dashboard/open-house/registrations">My registrations</Link>
                </Button>
            </div>

            {eventsQuery.isPending ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <EventCardSkeleton key={index} />
                    ))}
                </div>
            ) : eventsQuery.isError ? (
                <Card className="border-destructive/30 shadow-sm">
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-medium">Open House events could not be loaded.</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {getApiErrorMessage(eventsQuery.error)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => void eventsQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            ) : events.length === 0 ? (
                <Card className="border-border/80 shadow-sm">
                    <CardContent className="py-6 text-center">
                        <CalendarDaysIcon className="text-muted-foreground mx-auto size-10" />
                        <p className="mt-4 font-medium">No upcoming Open House events</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Check back later for new AFFORDAHOMES viewing opportunities.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {events.map((event) => {
                        const availability = getAvailability(event);
                        return (
                            <Card key={event.id} className="border-border/80 min-w-0 gap-5 shadow-sm">
                                <CardHeader className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={cn(
                                                "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                                                statusStyles[event.status],
                                            )}
                                        >
                                            {event.status}
                                        </span>
                                        <span
                                            className={cn(
                                                "rounded-md px-2 py-0.5 text-xs font-medium",
                                                availability.className,
                                            )}
                                        >
                                            {availability.label}
                                        </span>
                                    </div>
                                    <CardTitle className="break-words text-xl leading-snug">
                                        {event.title}
                                    </CardTitle>
                                    {event.project?.trim() ? (
                                        <CardDescription className="break-words">
                                            {event.project.trim()}
                                        </CardDescription>
                                    ) : null}
                                </CardHeader>
                                <CardContent className="min-w-0 flex-1 space-y-3 text-sm">
                                    <div className="flex items-start gap-2">
                                        <MapPinIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                        <span className="min-w-0 break-words">{event.location}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CalendarDaysIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                        <span>{formatOpenHouseDate(event.event_date)}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <ClockIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                        <span>
                                            {formatOpenHouseTimeRange(event.start_time, event.end_time)}
                                            <span className="text-muted-foreground"> · Philippine time</span>
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <UsersRoundIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                        <div className="min-w-0">
                                            <p>
                                                {event.capacity === null
                                                    ? `${event.registrations_count} registered · No set capacity`
                                                    : `${event.registrations_count} of ${event.capacity} registered`}
                                            </p>
                                            {event.remaining_slots !== null ? (
                                                <p className="text-muted-foreground text-xs">
                                                    {event.remaining_slots === 1
                                                        ? "1 slot remaining"
                                                        : `${event.remaining_slots} slots remaining`}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" asChild>
                                        <Link
                                            to="/dashboard/open-house/$eventId"
                                            params={{ eventId: event.id }}
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

export default ClientOpenHousePage;
