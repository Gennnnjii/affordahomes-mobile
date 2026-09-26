import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { PropertyMapDefinition } from "@/types/property-site-plan";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, MapIcon } from "lucide-react";

interface PropertyMapCatalogProps {
    definitions: readonly PropertyMapDefinition[];
}

export const PropertyMapCatalog = ({ definitions }: PropertyMapCatalogProps) => (
    <section aria-labelledby="map-catalog-heading" className="space-y-4">
        <div>
            <h2 id="map-catalog-heading" className="text-xl font-semibold">
                Choose a subdivision map
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
                Choose a subdivision to view its available site plan.
            </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {definitions.map((definition) => {
                const isSelectable = Boolean(definition.sitePlan);

                return (
                    <Card key={definition.id} className="min-w-0 gap-4">
                        <CardHeader>
                            <div className="bg-primary/10 text-primary mb-1 flex size-10 items-center justify-center rounded-lg">
                                <MapIcon className="size-5" aria-hidden />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="break-words leading-snug">
                                    {definition.name}
                                </CardTitle>
                                <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium">
                                    {definition.availability === "coming-soon"
                                        ? "Map coming soon"
                                        : definition.availability === "digitizing"
                                          ? "Digitization in progress"
                                          : "Map available"}
                                </span>
                            </div>
                            <CardDescription className="break-words leading-relaxed">
                                {definition.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto">
                            {isSelectable ? (
                                <Button className="w-full" asChild>
                                    <Link
                                        to="/properties/map"
                                        search={{ map: definition.id }}
                                    >
                                        View map
                                        <ArrowRightIcon className="size-4" aria-hidden />
                                    </Link>
                                </Button>
                            ) : (
                                <Button className="w-full" variant="outline" disabled>
                                    Map coming soon
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    </section>
);
