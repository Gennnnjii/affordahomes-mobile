import {
    OpenHouseEventForm,
    type OpenHouseEventFormState,
    type OpenHouseEventFormValues,
} from "@/app/(admin)/AdminOpenHouseCreatePage";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminResourceApi } from "@/db/api/admin.api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { OpenHouseEvent } from "@/types/open-house";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";

const toTimeInput = (value: string): string => {
    const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return "";
    return `${match[1]}:${match[2]}`;
};

const formStateFor = (event: OpenHouseEvent): OpenHouseEventFormState => ({
    title: event.title,
    project: event.project ?? "",
    location: event.location,
    description: event.description ?? "",
    eventDate: event.event_date,
    startTime: toTimeInput(event.start_time),
    endTime: toTimeInput(event.end_time),
    status: event.status,
    capacity: event.capacity === null ? "" : String(event.capacity),
});

const AdminOpenHouseUpdatePage = () => {
    const { eventId } = useParams({ strict: false }) as { eventId: string };
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const eventQuery = useQuery({
        queryKey: ["admin", "open-house", eventId],
        queryFn: () => adminResourceApi.openHouseEvent(eventId),
        enabled: Boolean(eventId),
    });
    const updateMutation = useMutation({
        mutationFn: (values: OpenHouseEventFormValues) =>
            adminResourceApi.updateOpenHouseEvent(eventId, values),
        onSuccess: (response) => {
            void queryClient.invalidateQueries({
                queryKey: ["admin", "open-house"],
                exact: true,
            });
            void queryClient.invalidateQueries({
                queryKey: ["admin", "open-house", eventId],
                exact: true,
            });
            toast.success(response.message || "Open House event updated.");
            navigate({
                to: "/admin/open-house/$eventId",
                params: { eventId },
            });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    if (eventQuery.isPending) {
        return (
            <div className="mx-auto max-w-4xl space-y-6">
                <Skeleton className="h-5 w-32" />
                <Card>
                    <CardContent className="space-y-5 pt-6">
                        <Skeleton className="h-7 w-56" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-9 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (eventQuery.isError || !eventQuery.data?.data) {
        return (
            <div className="mx-auto max-w-4xl space-y-6">
                <ScreenBackLink to="/admin/open-house" label="Open House" />
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div>
                            <h1 className="text-xl font-semibold">
                                Open House event unavailable
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {eventQuery.isError
                                    ? getApiErrorMessage(eventQuery.error)
                                    : "The event could not be found."}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void eventQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const event = eventQuery.data.data;
    const legacyUnlimited = event.capacity === null;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <ScreenBackLink
                to={`/admin/open-house/${eventId}`}
                label="Event details"
            />
            <OpenHouseEventForm
                key={event.id}
                initialValues={formStateFor(event)}
                title="Update Open House event"
                description="Edit public event content, schedule, capacity, or manual status."
                submitLabel="Save changes"
                pendingLabel="Saving..."
                isPending={updateMutation.isPending}
                submissionError={
                    updateMutation.isError ? updateMutation.error : undefined
                }
                allowBlankCapacity={legacyUnlimited}
                capacityHelp={
                    legacyUnlimited
                        ? "Leave blank to keep this legacy event unlimited, or enter a number to enforce capacity."
                        : `Current registrations: ${event.registrations_count}. Capacity cannot be cleared or reduced below that count.`
                }
                onFieldChange={() => updateMutation.reset()}
                onSubmit={(values) => updateMutation.mutate(values)}
            />
        </div>
    );
};

export default AdminOpenHouseUpdatePage;
