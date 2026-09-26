/**
 * Single source of truth for listing status (matches API / admin: available | reserved | sold).
 */

export const PROPERTY_STATUS_OPTIONS = [
    {
        value: "available" as const,
        label: "Available",
        badgeClass:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
        triggerBorder: "border-l-emerald-500",
    },
    {
        value: "reserved" as const,
        label: "Reserved",
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
        triggerBorder: "border-l-amber-500",
    },
    {
        value: "sold" as const,
        label: "Sold",
        badgeClass: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
        triggerBorder: "border-l-zinc-400 dark:border-l-zinc-500",
    },
] as const;

export type PropertyStatusValue = (typeof PROPERTY_STATUS_OPTIONS)[number]["value"];

const byValue = Object.fromEntries(PROPERTY_STATUS_OPTIONS.map((o) => [o.value, o])) as Record<
    PropertyStatusValue,
    (typeof PROPERTY_STATUS_OPTIONS)[number]
>;

/** Normalize API / legacy values to a known status. */
export function normalizePropertyStatus(raw: string | undefined | null): PropertyStatusValue {
    const s = String(raw ?? "available").toLowerCase().trim();
    if (s === "reserved" || s === "sold" || s === "available") return s;
    return "available";
}

export function propertyStatusLabel(raw: string | undefined | null): string {
    return byValue[normalizePropertyStatus(raw)].label;
}

export function propertyStatusBadgeClass(raw: string | undefined | null): string {
    return byValue[normalizePropertyStatus(raw)].badgeClass;
}

export function propertyStatusTriggerBorder(raw: string | undefined | null): string {
    return byValue[normalizePropertyStatus(raw)].triggerBorder;
}

/** Only `available` listings accept new reservation inquiries from the public portal. */
export function isPropertyAvailableForReservation(raw: string | undefined | null): boolean {
    return normalizePropertyStatus(raw) === "available";
}
