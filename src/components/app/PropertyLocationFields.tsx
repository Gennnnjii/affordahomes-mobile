import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { projectsForCity } from "@/lib/pampanga-location";
import type { PampangaLocationCatalog } from "@/types/pampanga-location";

type PropertyLocationFieldsProps = {
    catalog?: PampangaLocationCatalog;
    city: string;
    project: string;
    onCityChange: (city: string) => void;
    onProjectChange: (project: string) => void;
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    idPrefix: string;
    required?: boolean;
    showHistoricalLocation?: boolean;
    historicalProvince?: string | null;
    historicalCity?: string | null;
    historicalProject?: string | null;
};

export const PropertyLocationFields = ({
    catalog,
    city,
    project,
    onCityChange,
    onProjectChange,
    isLoading,
    isError,
    onRetry,
    idPrefix,
    required = false,
    showHistoricalLocation = false,
    historicalProvince,
    historicalCity,
    historicalProject,
}: PropertyLocationFieldsProps) => {
    const projects = projectsForCity(catalog, city);
    const unavailable = isLoading || isError || !catalog;

    const handleCityChange = (nextCity: string) => {
        onCityChange(nextCity);
        if (!projectsForCity(catalog, nextCity).includes(project)) {
            onProjectChange("");
        }
    };

    return (
        <div className="space-y-4">
            {showHistoricalLocation ? (
                <div className="border-border bg-muted/30 rounded-lg border p-4 text-sm">
                    <p className="font-medium">Existing historical location</p>
                    <p className="text-muted-foreground mt-1">
                        {[historicalProject, historicalCity, historicalProvince]
                            .filter(Boolean)
                            .join(" · ") || "No historical location recorded."}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs">
                        Leave the canonical selectors empty to preserve this value, or select both a
                        city and project to classify the property.
                    </p>
                    {city || project ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-2 px-0"
                            onClick={() => {
                                onCityChange("");
                                onProjectChange("");
                            }}
                        >
                            Keep historical location
                        </Button>
                    ) : null}
                </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                    <Label>Province</Label>
                    <div className="border-border bg-muted/40 flex h-9 items-center rounded-md border px-3 text-sm font-medium">
                        {catalog?.province ?? (isLoading ? "Loading…" : "Unavailable")}
                    </div>
                    <p className="text-muted-foreground text-xs">
                        The province is assigned by AFFORDAHOMES.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${idPrefix}-city`}>
                        City / Municipality
                        {required ? <span className="text-destructive"> *</span> : null}
                    </Label>
                    <Select
                        value={city || undefined}
                        onValueChange={handleCityChange}
                        disabled={unavailable}
                    >
                        <SelectTrigger
                            id={`${idPrefix}-city`}
                            className="w-full"
                            aria-required={required}
                        >
                            <SelectValue placeholder="Select city / municipality" />
                        </SelectTrigger>
                        <SelectContent>
                            {(catalog?.city_municipalities ?? []).map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${idPrefix}-project`}>
                        Project / Subdivision
                        {required ? <span className="text-destructive"> *</span> : null}
                    </Label>
                    <Select
                        value={project || undefined}
                        onValueChange={onProjectChange}
                        disabled={unavailable || !city}
                    >
                        <SelectTrigger
                            id={`${idPrefix}-project`}
                            className="w-full"
                            aria-required={required}
                        >
                            <SelectValue placeholder={city ? "Select project" : "Select city first"} />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {city && !project ? (
                <p className="text-destructive text-xs" role="alert">
                    Select a project that belongs to the chosen city / municipality.
                </p>
            ) : null}
            {isLoading ? (
                <p className="text-muted-foreground text-xs">Loading canonical location options…</p>
            ) : null}
            {isError ? (
                <div className="border-destructive/30 bg-destructive/5 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
                    <p className="text-destructive text-sm">
                        Canonical location options are unavailable.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                        Try again
                    </Button>
                </div>
            ) : null}
        </div>
    );
};
