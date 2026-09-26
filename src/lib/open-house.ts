const eventDateFormatter = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeZone: "UTC",
});

const registeredAtFormatter = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
});

const parseDateOnly = (value: string): Date | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
};

export const formatOpenHouseDate = (value?: string | null): string => {
    if (!value) return "Date unavailable";
    const date = parseDateOnly(value);
    return date ? eventDateFormatter.format(date) : "Date unavailable";
};

export const formatOpenHouseTime = (value?: string | null): string => {
    if (!value) return "Time unavailable";

    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!match) return "Time unavailable";

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = match[3] === undefined ? 0 : Number(match[3]);
    if (hour > 23 || minute > 59 || second > 59) return "Time unavailable";

    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

export const formatOpenHouseTimeRange = (
    startTime?: string | null,
    endTime?: string | null,
): string => {
    const start = formatOpenHouseTime(startTime);
    const end = formatOpenHouseTime(endTime);
    if (start === "Time unavailable" || end === "Time unavailable") {
        return "Schedule unavailable";
    }
    return `${start} – ${end}`;
};

export const formatOpenHouseRegisteredAt = (value?: string | null): string => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : registeredAtFormatter.format(date);
};
