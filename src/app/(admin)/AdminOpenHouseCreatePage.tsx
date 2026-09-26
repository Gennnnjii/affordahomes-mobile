import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adminResourceApi } from "@/db/api/admin.api";
import { getApiErrorData, getApiErrorMessage } from "@/lib/api-error";
import type { OpenHouseEventStatus } from "@/types/open-house";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export interface OpenHouseEventFormState {
    title: string;
    project: string;
    location: string;
    description: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    status: OpenHouseEventStatus;
    capacity: string;
}

export interface OpenHouseEventFormValues {
    title: string;
    project: string | null;
    location: string;
    description: string | null;
    event_date: string;
    start_time: string;
    end_time: string;
    status: OpenHouseEventStatus;
    capacity?: number;
}

type FormField = keyof OpenHouseEventFormState;
type FormErrors = Partial<Record<FormField, string>>;

const statusOptions: Array<{ value: OpenHouseEventStatus; label: string }> = [
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

const isValidDate = (value: string): boolean => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const timeToMinutes = (value: string): number | null => {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
};

const FieldError = ({ message }: { message?: string }) =>
    message ? (
        <p className="text-destructive text-xs" role="alert">
            {message}
        </p>
    ) : null;

const apiFieldMap: Record<string, FormField> = {
    title: "title",
    project: "project",
    location: "location",
    description: "description",
    event_date: "eventDate",
    start_time: "startTime",
    end_time: "endTime",
    status: "status",
    capacity: "capacity",
};

const getFormApiErrors = (error: unknown): FormErrors => {
    if (!error) return {};

    const data = getApiErrorData(error);
    if (!data) return {};

    return Object.entries(data).reduce<FormErrors>((result, [key, value]) => {
        const field = apiFieldMap[key];
        if (!field) return result;
        const message = Array.isArray(value)
            ? value.find((item): item is string => typeof item === "string")
            : typeof value === "string"
              ? value
              : undefined;
        if (message) result[field] = message;
        return result;
    }, {});
};

interface OpenHouseEventFormProps {
    initialValues: OpenHouseEventFormState;
    title: string;
    description: string;
    submitLabel: string;
    pendingLabel: string;
    isPending: boolean;
    submissionError?: unknown;
    allowBlankCapacity?: boolean;
    capacityHelp?: string;
    onFieldChange?: () => void;
    onSubmit: (values: OpenHouseEventFormValues) => void;
}

export const OpenHouseEventForm = ({
    initialValues,
    title,
    description,
    submitLabel,
    pendingLabel,
    isPending,
    submissionError,
    allowBlankCapacity = false,
    capacityHelp,
    onFieldChange,
    onSubmit,
}: OpenHouseEventFormProps) => {
    const [form, setForm] = useState(initialValues);
    const [errors, setErrors] = useState<FormErrors>({});
    const serverErrors = getFormApiErrors(submissionError);
    const errorFor = (field: FormField) =>
        errors[field] ?? serverErrors[field];

    const setField = <Key extends FormField>(
        field: Key,
        value: OpenHouseEventFormState[Key],
    ) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
        onFieldChange?.();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const next: FormErrors = {};
        const titleValue = form.title.trim();
        const projectValue = form.project.trim();
        const locationValue = form.location.trim();
        const descriptionValue = form.description.trim();
        const start = timeToMinutes(form.startTime);
        const end = timeToMinutes(form.endTime);

        if (!titleValue) next.title = "Title is required.";
        else if (titleValue.length > 255) next.title = "Title must not exceed 255 characters.";
        if (projectValue.length > 255) next.project = "Project must not exceed 255 characters.";
        if (!locationValue) next.location = "Location is required.";
        else if (locationValue.length > 255) next.location = "Location must not exceed 255 characters.";
        if (descriptionValue.length > 5000) {
            next.description = "Description must not exceed 5000 characters.";
        }
        if (!isValidDate(form.eventDate)) next.eventDate = "A valid event date is required.";
        if (start === null) next.startTime = "A valid start time is required.";
        if (end === null) next.endTime = "A valid end time is required.";
        if (start !== null && end !== null && end <= start) {
            next.endTime = "End time must be later than start time.";
        }

        let capacity: number | undefined;
        const capacityText = form.capacity.trim();
        if (!capacityText && !allowBlankCapacity) {
            next.capacity = "Capacity is required.";
        } else if (capacityText) {
            if (!/^\d+$/.test(capacityText) || Number(capacityText) < 1) {
                next.capacity = "Capacity must be a whole number of at least 1.";
            } else {
                capacity = Number(capacityText);
            }
        }

        setErrors(next);
        if (Object.keys(next).length) return;
        onSubmit({
            title: titleValue,
            project: projectValue || null,
            location: locationValue,
            description: descriptionValue || null,
            event_date: form.eventDate,
            start_time: form.startTime,
            end_time: form.endTime,
            status: form.status,
            ...(capacity === undefined ? {} : { capacity }),
        });
    };

    return (
        <Card className="border-border/80 overflow-hidden shadow-sm">
            <CardHeader>
                <h1 className="text-xl font-semibold">{title}</h1>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    {submissionError ? (
                        <div
                            className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm"
                            role="alert"
                        >
                            {getApiErrorMessage(submissionError)}
                        </div>
                    ) : null}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="open-house-title">Title</Label>
                            <Input
                                id="open-house-title"
                                value={form.title}
                                onChange={(event) => setField("title", event.target.value)}
                                maxLength={255}
                                disabled={isPending}
                                aria-invalid={Boolean(errorFor("title"))}
                                required
                            />
                            <FieldError message={errorFor("title")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="open-house-project">
                                Project
                                <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Input
                                id="open-house-project"
                                value={form.project}
                                onChange={(event) => setField("project", event.target.value)}
                                maxLength={255}
                                disabled={isPending}
                                aria-invalid={Boolean(errorFor("project"))}
                            />
                            <FieldError message={errorFor("project")} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="open-house-location">Location</Label>
                        <Input
                            id="open-house-location"
                            value={form.location}
                            onChange={(event) => setField("location", event.target.value)}
                            maxLength={255}
                            disabled={isPending}
                            aria-invalid={Boolean(errorFor("location"))}
                            required
                        />
                        <FieldError message={errorFor("location")} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="open-house-description">
                                Description
                                <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <span className="text-muted-foreground text-xs">
                                {form.description.length}/5000
                            </span>
                        </div>
                        <Textarea
                            id="open-house-description"
                            value={form.description}
                            onChange={(event) => setField("description", event.target.value)}
                            maxLength={5000}
                            rows={6}
                            disabled={isPending}
                            aria-invalid={Boolean(errorFor("description"))}
                        />
                        <FieldError message={errorFor("description")} />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="open-house-date">Event date</Label>
                            <Input
                                id="open-house-date"
                                type="date"
                                value={form.eventDate}
                                onChange={(event) => setField("eventDate", event.target.value)}
                                disabled={isPending}
                                aria-invalid={Boolean(errorFor("eventDate"))}
                                required
                            />
                            <FieldError message={errorFor("eventDate")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="open-house-start-time">Start time</Label>
                            <Input
                                id="open-house-start-time"
                                type="time"
                                value={form.startTime}
                                onChange={(event) => setField("startTime", event.target.value)}
                                disabled={isPending}
                                aria-invalid={Boolean(errorFor("startTime"))}
                                required
                            />
                            <FieldError message={errorFor("startTime")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="open-house-end-time">End time</Label>
                            <Input
                                id="open-house-end-time"
                                type="time"
                                value={form.endTime}
                                onChange={(event) => setField("endTime", event.target.value)}
                                disabled={isPending}
                                aria-invalid={Boolean(errorFor("endTime"))}
                                required
                            />
                            <FieldError message={errorFor("endTime")} />
                        </div>
                    </div>
                    <p className="text-muted-foreground -mt-3 text-xs">
                        Event dates and times use Philippine local time.
                    </p>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="open-house-status">Status</Label>
                            <Select
                                value={form.status}
                                onValueChange={(value) =>
                                    setField("status", value as OpenHouseEventStatus)
                                }
                                disabled={isPending}
                            >
                                <SelectTrigger
                                    id="open-house-status"
                                    className="w-full"
                                    aria-invalid={Boolean(errorFor("status"))}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errorFor("status")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="open-house-capacity">Capacity</Label>
                            <Input
                                id="open-house-capacity"
                                type="number"
                                min={1}
                                step={1}
                                value={form.capacity}
                                onChange={(event) => setField("capacity", event.target.value)}
                                disabled={isPending}
                                aria-invalid={Boolean(errorFor("capacity"))}
                                required={!allowBlankCapacity}
                            />
                            <FieldError message={errorFor("capacity")} />
                            {capacityHelp ? (
                                <p className="text-muted-foreground text-xs">{capacityHelp}</p>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                        <Button variant="outline" className="w-full sm:w-auto" asChild>
                            <Link to="/admin/open-house">Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            className="w-full sm:w-auto"
                            disabled={isPending}
                        >
                            {isPending ? pendingLabel : submitLabel}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

const initialValues: OpenHouseEventFormState = {
    title: "",
    project: "",
    location: "",
    description: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    status: "upcoming",
    capacity: "",
};

const AdminOpenHouseCreatePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const createMutation = useMutation({
        mutationFn: (values: OpenHouseEventFormValues) => {
            if (values.capacity === undefined) throw new Error("Capacity is required.");
            return adminResourceApi.createOpenHouseEvent({
                ...values,
                capacity: values.capacity,
            });
        },
        onSuccess: (response) => {
            void queryClient.invalidateQueries({
                queryKey: ["admin", "open-house"],
                exact: true,
            });
            toast.success(response.message || "Open House event created.");
            navigate({
                to: "/admin/open-house/$eventId",
                params: { eventId: response.data.id },
            });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <ScreenBackLink to="/admin/open-house" label="Open House" />
            <OpenHouseEventForm
                initialValues={initialValues}
                title="Create Open House event"
                description="Set the public event details, schedule, capacity, and initial status."
                submitLabel="Create event"
                pendingLabel="Creating..."
                isPending={createMutation.isPending}
                submissionError={
                    createMutation.isError ? createMutation.error : undefined
                }
                onFieldChange={() => createMutation.reset()}
                onSubmit={(values) => createMutation.mutate(values)}
            />
        </div>
    );
};

export default AdminOpenHouseCreatePage;
