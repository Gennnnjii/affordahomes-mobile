export const asRecord = (v: unknown): Record<string, unknown> =>
    v !== null && typeof v === "object" ? (v as Record<string, unknown>) : {};

export const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export const idStr = (v: unknown): string => {
    if (typeof v === "string" && v.length > 0) return v;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    return "";
};
