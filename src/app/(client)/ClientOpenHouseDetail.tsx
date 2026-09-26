import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { clientPortalApi } from "@/db/api/client.portal.api";
import { publicApi } from "@/db/api/public.api";
import { getApiErrorData, getApiErrorMessage } from "@/lib/api-error";
import { formatOpenHouseDate, formatOpenHouseTimeRange } from "@/lib/open-house";
import { cn } from "@/lib/utils";
import type { OpenHouseEvent, OpenHouseRegisterPayload } from "@/types/open-house";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
    CalendarDaysIcon,
    ClockIcon,
    MapPinIcon,
    TicketCheckIcon,
    UsersRoundIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
            description: "This event is currently accepting Client registrations.",
            className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        };
    }
    if (event.remaining_slots === 0) {
        return {
            label: "Full",
            description: "All available places for this Open House have been reserved.",
            className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        };
    }
    if (event.status === "ongoing") {
        return {
            label: "Ongoing — registration closed",
            description: "This Open House has started and is no longer accepting registrations.",
            className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        };
    }
    return {
        label: "Registration closed",
        description: "Registration is not available for this Open House.",
        className: "bg-muted text-muted-foreground",
    };
};

const DetailSkeleton = () => (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-border/80 shadow-sm">
            <CardHeader className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-5">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex gap-3">
                        <Skeleton className="size-9 shrink-0 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
            <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
            </CardContent>
        </Card>
    </div>
);

const ClientOpenHouseDetail = () => {
    const { eventId } = useParams({ strict: false }) as { eventId: string };
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
    const [propertyInterest, setPropertyInterest] = useState("");
    const [remarks, setRemarks] = useState("");
    const [formError, setFormError] = useState("");
    const [isAvailabilityRefreshing, setIsAvailabilityRefreshing] = useState(false);

    const eventQuery = useQuery({
        queryKey: ["public", "open-house", eventId],
        queryFn: () => publicApi.openHouseEvent(eventId),
        refetchInterval: 2_000,
        enabled: Boolean(eventId),
    });
    const registrationsQuery = useQuery({
        queryKey: ["client", "open-house", "registrations"],
        queryFn: () => clientPortalApi.openHouseRegistrations(),
        refetchInterval: 2_000,
    });

    const event = eventQuery.data?.data;
    const existingRegistration = event
        ? registrationsQuery.data?.data.find((item) => item.event_id === event.id)
        : undefined;

    const resetRegistrationForm = () => {
        setPropertyInterest("");
        setRemarks("");
        setFormError("");
    };
    const closeRegistrationDialog = () => {
        setIsRegistrationOpen(false);
        resetRegistrationForm();
    };
    const refreshEventAvailability = () =>
        Promise.all([
            queryClient.invalidateQueries({
                queryKey: ["public", "open-house"],
                exact: true,
            }),
            queryClient.invalidateQueries({
                queryKey: ["public", "open-house", eventId],
                exact: true,
            }),
        ]);

    const registerMutation = useMutation({
        mutationFn: (payload: OpenHouseRegisterPayload) =>
            clientPortalApi.registerForOpenHouse(eventId, payload),
        onSuccess: (response) => {
            toast.success(response.message || "Open House registration completed.");
            void refreshEventAvailability();
            void queryClient.invalidateQueries({
                queryKey: ["client", "open-house", "registrations"],
            });
            closeRegistrationDialog();
            void navigate({
                to: "/dashboard/open-house/registrations/$registrationId",
                params: { registrationId: response.data.id },
            });
        },
        onError: (error) => {
            const message = getApiErrorMessage(error);
            const errorData = getApiErrorData(error);
            const code = typeof errorData?.code === "string" ? errorData.code : undefined;
            toast.error(message);

            if (code === "ALREADY_REGISTERED") {
                void queryClient.invalidateQueries({
                    queryKey: ["client", "open-house", "registrations"],
                });
                const registrationId = errorData?.registration_id;
                closeRegistrationDialog();
                if (typeof registrationId === "string" && registrationId.length > 0) {
                    void navigate({
                        to: "/dashboard/open-house/registrations/$registrationId",
                        params: { registrationId },
                    });
                }
                return;
            }

            if (code === "EVENT_FULL" || code === "REGISTRATION_CLOSED") {
                setIsAvailabilityRefreshing(true);
                closeRegistrationDialog();
                void refreshEventAvailability().finally(() => setIsAvailabilityRefreshing(false));
                return;
            }
            const validationMessage = Object.values(errorData ?? {})
                .flatMap((value) => (Array.isArray(value) ? value : []))
                .find((value): value is string => typeof value === "string");
            setFormError(validationMessage ?? message);
        },
    });

    const handleDialogChange = (open: boolean) => {
        if (!open && registerMutation.isPending) return;
        setIsRegistrationOpen(open);
        if (!open) resetRegistrationForm();
    };

    const handleSubmit = (submitEvent: React.FormEvent<HTMLFormElement>) => {
        submitEvent.preventDefault();
        const trimmedPropertyInterest = propertyInterest.trim();
        const trimmedRemarks = remarks.trim();

        if (trimmedPropertyInterest.length > 255) {
            setFormError("Property interest must be 255 characters or fewer.");
            return;
        }
        if (trimmedRemarks.length > 2000) {
            setFormError("Remarks must be 2,000 characters or fewer.");
            return;
        }

        setFormError("");
        registerMutation.mutate({
            property_interest: trimmedPropertyInterest || null,
            remarks: trimmedRemarks || null,
        });
    };

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/open-house" label="Open House" hideFrom="md" />

            {eventQuery.isPending ? (
                <DetailSkeleton />
            ) : eventQuery.isError || !event ? (
                <Card className="border-destructive/30 shadow-sm">
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-medium">This Open House could not be loaded.</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {eventQuery.isError
                                    ? getApiErrorMessage(eventQuery.error)
                                    : "Open House event not found."}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button variant="outline" asChild>
                                <Link to="/dashboard/open-house">Return to Open House</Link>
                            </Button>
                            {eventQuery.isError ? (
                                <Button type="button" onClick={() => void eventQuery.refetch()}>
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
                            <span
                                className={cn(
                                    "w-fit rounded-md px-2.5 py-1 text-xs font-semibold capitalize",
                                    statusStyles[event.status],
                                )}
                            >
                                {event.status}
                            </span>
                            <h1 className="break-words text-2xl font-semibold leading-tight">
                                {event.title}
                            </h1>
                            {event.project?.trim() ? (
                                <p className="text-muted-foreground break-words text-sm">
                                    {event.project.trim()}
                                </p>
                            ) : null}
                        </CardHeader>
                        <CardContent className="min-w-0 space-y-5">
                            <Separator />
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
                                            {formatOpenHouseTimeRange(event.start_time, event.end_time)}
                                        </p>
                                        <p className="text-muted-foreground text-xs">Philippine time</p>
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
                                        <p className="mt-1 break-words font-medium">{event.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:col-span-2">
                                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                        <UsersRoundIcon className="text-muted-foreground size-4" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                            Attendance
                                        </p>
                                        <p className="mt-1 font-medium">
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
                            </div>
                            <Separator />
                            <div>
                                <h2 className="font-semibold">About this Open House</h2>
                                <p className="text-muted-foreground mt-2 whitespace-pre-wrap break-words text-sm leading-7">
                                    {event.description?.trim() ||
                                        "No additional event description is available."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80 min-w-0 self-start shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TicketCheckIcon className="text-primary size-5" />
                                Registration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {registrationsQuery.isPending ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-40" />
                                    <Skeleton className="h-4 w-full" />
                                    <Button className="w-full" disabled>
                                        Checking registration...
                                    </Button>
                                </div>
                            ) : registrationsQuery.isError ? (
                                <div className="space-y-3">
                                    <p className="font-medium">Registration status unavailable</p>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {getApiErrorMessage(registrationsQuery.error)}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => void registrationsQuery.refetch()}
                                    >
                                        Try again
                                    </Button>
                                </div>
                            ) : existingRegistration ? (
                                <div className="space-y-3">
                                    <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 inline-flex rounded-md px-2.5 py-1 text-xs font-semibold">
                                        Already registered
                                    </span>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Your registration is confirmed in your Open House history.
                                    </p>
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link
                                            to="/dashboard/open-house/registrations/$registrationId"
                                            params={{ registrationId: existingRegistration.id }}
                                        >
                                            View registration
                                        </Link>
                                    </Button>
                                </div>
                            ) : isAvailabilityRefreshing || eventQuery.isFetching ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-40" />
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Refreshing the latest registration availability...
                                    </p>
                                    <Button className="w-full" disabled>
                                        Checking availability...
                                    </Button>
                                </div>
                            ) : (() => {
                                const availability = getAvailability(event);
                                return (
                                    <div className="space-y-3">
                                        <span
                                            className={cn(
                                                "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold",
                                                availability.className,
                                            )}
                                        >
                                            {availability.label}
                                        </span>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {availability.description}
                                        </p>
                                        <Button
                                            type="button"
                                            className="w-full"
                                            disabled={!event.registration_open}
                                            onClick={() => setIsRegistrationOpen(true)}
                                        >
                                            {event.registration_open
                                                ? "Register"
                                                : event.remaining_slots === 0
                                                    ? "Full"
                                                    : "Registration Closed"}
                                        </Button>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </div>
            )}

            <Dialog open={isRegistrationOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-lg">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Register for Open House</DialogTitle>
                            <DialogDescription>
                                Share optional details that may help AFFORDAHOMES understand what you
                                are looking for.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="open-house-property-interest">
                                    Property interest{" "}
                                    <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Input
                                    id="open-house-property-interest"
                                    value={propertyInterest}
                                    onChange={(inputEvent) => {
                                        setPropertyInterest(inputEvent.target.value);
                                        setFormError("");
                                    }}
                                    placeholder="e.g. Two-bedroom home or a specific project"
                                    maxLength={255}
                                    disabled={registerMutation.isPending}
                                />
                                <p className="text-muted-foreground text-right text-xs">
                                    {propertyInterest.length}/255
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="open-house-remarks">
                                    Remarks{" "}
                                    <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Textarea
                                    id="open-house-remarks"
                                    value={remarks}
                                    onChange={(inputEvent) => {
                                        setRemarks(inputEvent.target.value);
                                        setFormError("");
                                    }}
                                    placeholder="Add any questions or helpful details for your visit."
                                    maxLength={2000}
                                    rows={5}
                                    disabled={registerMutation.isPending}
                                />
                                <p className="text-muted-foreground text-right text-xs">
                                    {remarks.length}/2000
                                </p>
                            </div>
                            {formError ? (
                                <p className="text-destructive text-sm" role="alert">
                                    {formError}
                                </p>
                            ) : null}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeRegistrationDialog}
                                disabled={registerMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={registerMutation.isPending}>
                                {registerMutation.isPending ? "Registering..." : "Register"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientOpenHouseDetail;
