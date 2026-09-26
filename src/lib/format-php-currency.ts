
export function formatPhpCurrency(value: number | string | null | undefined): string {
    const n = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(n)) return "—";
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
    }).format(n);
}
