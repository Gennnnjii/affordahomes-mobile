const LEGEND_ITEMS = [
    { label: "Available", className: "bg-emerald-400 border-emerald-700" },
    { label: "Reserved", className: "bg-amber-400 border-amber-700" },
    { label: "Sold", className: "bg-red-800 border-red-950" },
    { label: "No active property listing", className: "bg-zinc-200 border-zinc-500" },
] as const;

export const PropertyMapLegend = () => (
    <div aria-label="Property status legend" className="flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs sm:text-sm">
                <span
                    className={`size-3 shrink-0 rounded-sm border ${item.className}`}
                    aria-hidden
                />
                <span>{item.label}</span>
            </div>
        ))}
    </div>
);
