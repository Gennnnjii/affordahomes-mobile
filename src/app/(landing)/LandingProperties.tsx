import { LandingChrome } from "@/components/layout/LandingChrome";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { publicApi } from "@/db/api/public.api";
import { formatPhpCurrency } from "@/lib/format-php-currency";
import { asRecord, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
    HomeIcon,
    MapIcon,
    MapPinIcon,
    SearchIcon,
    SlidersHorizontalIcon,
    XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { findPropertyMapDefinition } from "@/data/property-maps/maps";
import {
    PROPERTY_STATUS_OPTIONS,
    normalizePropertyStatus,
    propertyStatusBadgeClass,
    propertyStatusLabel,
} from "@/lib/property-status";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "default" | "price_asc" | "price_desc" | "title_asc";

interface Filters {
    search: string;
    status: string;       // "" | "available" | "reserved" | "sold"
    priceMin: string;
    priceMax: string;
    sort: SortKey;
}

const DEFAULT_FILTERS: Filters = {
    search: "",
    status: "",
    priceMin: "",
    priceMax: "",
    sort: "default",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "default", label: "Default" },
    { value: "price_asc", label: "Price: low to high" },
    { value: "price_desc", label: "Price: high to low" },
    { value: "title_asc", label: "Title: A – Z" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────


function matchesSearch(p: Record<string, unknown>, q: string): boolean {
    if (!q) return true;
    const lower = q.toLowerCase();
    const fields = [
        str(p.title),
        str(p.description),
        str(p.project),
        str(p.city_municipality),
        str(p.province),
    ];
    return fields.some((f) => f?.toLowerCase().includes(lower));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PropertySkeleton = () => (
    <Card className="border-border/80 overflow-hidden rounded-xl p-0 shadow-sm">
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
        <CardContent className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="mt-2 h-9 w-full" />
        </CardContent>
    </Card>
);

// ─── Main component ───────────────────────────────────────────────────────────

const LandingProperties = () => {
    const { projectSlug } = useParams({ strict: false }) as { projectSlug: string };
    const selectedProject = findPropertyMapDefinition(projectSlug);
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const { data, isPending, isError } = useQuery({
        queryKey: ["public", "properties", "project", selectedProject?.id],
        queryFn: async () => {
            if (!selectedProject) {
                throw new Error("Project unavailable.");
            }

            return publicApi.properties({ project: selectedProject.name });
        },
        enabled: Boolean(selectedProject),
        refetchInterval: 2_000,
    });

    const allRows = useMemo(() => (data?.data as unknown[]) ?? [], [data]);

    const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
        setFilters((prev) => ({ ...prev, [key]: value }));

    const resetFilters = () => setFilters(DEFAULT_FILTERS);

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (filters.search) n++;
        if (filters.status) n++;
        if (filters.priceMin) n++;
        if (filters.priceMax) n++;
        return n;
    }, [filters]);

    // Filtered + sorted rows
    const filteredRows = useMemo(() => {
        if (!selectedProject) return [];

        let rows = allRows
            .map((r) => asRecord(r))
            .filter((property) => str(property.project) === selectedProject.name);

        if (filters.search)
            rows = rows.filter((p) => matchesSearch(p, filters.search));

        if (filters.status)
            rows = rows.filter((p) => normalizePropertyStatus(str(p.status)) === filters.status);


        if (filters.priceMin) {
            const min = Number(filters.priceMin);
            rows = rows.filter((p) => Number(p.price) >= min);
        }
        if (filters.priceMax) {
            const max = Number(filters.priceMax);
            rows = rows.filter((p) => Number(p.price) <= max);
        }

        switch (filters.sort) {
            case "price_asc":
                rows.sort((a, b) => Number(a.price) - Number(b.price));
                break;
            case "price_desc":
                rows.sort((a, b) => Number(b.price) - Number(a.price));
                break;
            case "title_asc":
                rows.sort((a, b) =>
                    (str(a.title) ?? "").localeCompare(str(b.title) ?? ""),
                );
                break;
        }

        return rows;
    }, [allRows, filters, selectedProject]);

    if (!selectedProject) {
        return (
            <LandingChrome>
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-12 lg:px-14">
                    <ScreenBackLink to="/properties" label="Back to projects" />
                    <Card className="border-border/80">
                        <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                            <HomeIcon
                                className="text-muted-foreground/30 mb-4 size-12"
                                strokeWidth={1}
                            />
                            <h1 className="text-xl font-semibold">Project unavailable</h1>
                            <p className="text-muted-foreground mt-2 max-w-lg text-sm leading-relaxed">
                                This project could not be found. Choose one of the available
                                AFFORDAHOMES projects to continue.
                            </p>
                            <Button className="mt-5" asChild>
                                <Link to="/properties">View projects</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </LandingChrome>
        );
    }

    return (
        <LandingChrome>
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-12 lg:px-14">
                <ScreenBackLink to="/properties" label="Back to projects" />

                {/* ── Header ── */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                            AFFORDAHOMES properties
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                            {selectedProject.name}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Explore properties in this project.
                        </p>
                    </div>

                    {/* Sort (always visible) + filter toggle */}
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <Link
                                to="/properties/map"
                                search={{ map: selectedProject.id }}
                            >
                                <MapIcon className="size-3.5" />
                                Property Map
                            </Link>
                        </Button>

                        <Select
                            value={filters.sort}
                            onValueChange={(v) => set("sort", v as SortKey)}
                        >
                            <SelectTrigger className="h-9 w-44 text-sm">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant={filtersOpen ? "default" : "outline"}
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setFiltersOpen((v) => !v)}
                        >
                            <SlidersHorizontalIcon className="size-3.5" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="bg-primary text-primary-foreground ml-0.5 inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* ── Search bar (always visible) ── */}
                <div className="relative">
                    <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        className="h-11 pl-9"
                        placeholder="Search by title, project, city…"
                        value={filters.search}
                        onChange={(e) => set("search", e.target.value)}
                    />
                    {filters.search && (
                        <button
                            type="button"
                            onClick={() => set("search", "")}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                        >
                            <XIcon className="size-4" />
                        </button>
                    )}
                </div>

                {/* ── Expanded filter panel ── */}
                {filtersOpen && (
                    <div className="bg-muted/40 border-border rounded-xl border p-5">
                        <div className="grid gap-5 sm:grid-cols-2">

                            {/* Status */}
                            <div className="space-y-2 sm:col-span-2">
                                <Label className="text-xs font-medium uppercase tracking-wide">Status</Label>
                                <div className="flex flex-wrap gap-2">
                                    {PROPERTY_STATUS_OPTIONS.map((s) => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() =>
                                                set("status", filters.status === s.value ? "" : s.value)
                                            }
                                            className={cn(
                                                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                                                filters.status === s.value
                                                    ? cn(
                                                        s.badgeClass,
                                                        "border-transparent ring-primary/35 ring-2 ring-offset-2 ring-offset-background",
                                                    )
                                                    : "border-border text-muted-foreground hover:border-primary hover:text-primary bg-background",
                                            )}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Separator className="sm:col-span-2" />

                            {/* Price min */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium uppercase tracking-wide">
                                    Min price (₱)
                                </Label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="e.g. 1 000 000"
                                    className="h-9 text-sm"
                                    value={filters.priceMin}
                                    onChange={(e) => set("priceMin", e.target.value)}
                                />
                            </div>

                            {/* Price max */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium uppercase tracking-wide">
                                    Max price (₱)
                                </Label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="e.g. 5 000 000"
                                    className="h-9 text-sm"
                                    value={filters.priceMax}
                                    onChange={(e) => set("priceMax", e.target.value)}
                                />
                            </div>
                        </div>

                        {activeFilterCount > 0 && (
                            <div className="mt-4 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground gap-1.5 text-xs"
                                    onClick={resetFilters}
                                >
                                    <XIcon className="size-3.5" />
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Results count ── */}
                {!isPending && !isError && allRows.length > 0 && (
                    <p className="text-muted-foreground text-sm">
                        Showing{" "}
                        <span className="text-foreground font-medium">{filteredRows.length}</span>
                        {" "}of{" "}
                        <span className="text-foreground font-medium">{allRows.length}</span>{" "}
                        {allRows.length === 1 ? "property" : "properties"}
                    </p>
                )}

                {/* ── Property grid ── */}
                {isPending ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <PropertySkeleton key={i} />
                        ))}
                    </div>
                ) : isError ? (
                    <p className="text-destructive">Could not load properties.</p>
                ) : filteredRows.length === 0 ? (
                    <div className="py-20 text-center">
                        <HomeIcon className="text-muted-foreground/30 mx-auto mb-4 size-12" strokeWidth={1} />
                        <p className="text-muted-foreground text-sm">
                            {allRows.length === 0
                                ? `No properties are currently listed in ${selectedProject.name}.`
                                : "No properties match your filters."}
                        </p>
                        {activeFilterCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={resetFilters}
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredRows.map((p) => {
                            const id = str(p.id) ?? "";
                            const title = str(p.title) ?? "Property";
                            const locationLines = [
                                str(p.project),
                                str(p.city_municipality),
                                str(p.province),
                            ].filter(
                                (line, index, lines): line is string =>
                                    Boolean(line) && lines.indexOf(line) === index,
                            );
                            const price = p.price;
                            const status = normalizePropertyStatus(str(p.status));
                            const img = publicStorageUrl(str(p.main_image));
                            const colorClass = propertyStatusBadgeClass(status);

                            return (
                                <Card
                                    key={id}
                                    className="border-border/80 flex flex-col overflow-hidden rounded-xl p-0 shadow-sm"
                                >
                                    <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
                                        {img ? (
                                            <img
                                                src={img}
                                                alt={title}
                                                className="size-full object-cover transition-transform duration-300 hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center">
                                                <HomeIcon
                                                    className="text-muted-foreground/30 size-12"
                                                    strokeWidth={1}
                                                />
                                            </div>
                                        )}
                                        <span
                                            className={`absolute left-3 top-3 rounded-md px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
                                        >
                                            {propertyStatusLabel(status)}
                                        </span>
                                    </div>

                                    <CardContent className="flex flex-1 flex-col gap-2 p-5">
                                        <h3 className="line-clamp-2 font-semibold leading-snug">{title}</h3>

                                        {locationLines.length > 0 && (
                                            <div className="text-muted-foreground flex items-start gap-1.5 text-sm">
                                                <MapPinIcon className="text-primary mt-0.5 size-3.5 shrink-0" />
                                                <div className="min-w-0 space-y-0.5">
                                                    {locationLines.map((line, index) => (
                                                        <p
                                                            key={line}
                                                            className={cn(
                                                                "line-clamp-2",
                                                                index === 0
                                                                    ? "text-foreground font-medium"
                                                                    : undefined,
                                                            )}
                                                        >
                                                            {line}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-primary text-lg font-bold">
                                            {formatPhpCurrency(
                                                typeof price === "number" || typeof price === "string"
                                                    ? Number(price)
                                                    : null,
                                            )}
                                        </p>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="mt-auto w-full"
                                        >
                                            <Link
                                                to="/property/$propertyId"
                                                params={{ propertyId: id }}
                                            >
                                                View details
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </LandingChrome>
    );
};

export default LandingProperties;
