import { LandingChrome } from "@/components/layout/LandingChrome";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROPERTY_MAP_DEFINITIONS } from "@/data/property-maps/maps";
import { usePampangaLocations } from "@/hooks/use-pampanga-locations";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, Building2Icon, MapIcon, MapPinIcon } from "lucide-react";

const LandingPropertyProjects = () => {
    const locationsQuery = usePampangaLocations();
    const locationCatalog = locationsQuery.data?.data;

    return (
        <LandingChrome>
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-12 lg:px-14">
                <ScreenBackLink to="/" label="Home" />

                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
                        <p className="text-muted-foreground mt-1">
                            Choose a project to explore its properties.
                        </p>
                    </div>

                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                        <Button size="sm" className="gap-1.5" asChild>
                            <Link to="/properties/inventory" search={{ page: 1 }}>
                                <Building2Icon className="size-3.5" aria-hidden />
                                Browse live inventory
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <Link to="/properties/map" search={{}}>
                                <MapIcon className="size-3.5" aria-hidden />
                                Property Map
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {PROPERTY_MAP_DEFINITIONS.map((definition) => {
                        const municipality = locationCatalog?.city_municipalities.find((city) =>
                            locationCatalog.projects_by_city[city]?.includes(definition.name),
                        );

                        return (
                            <Card
                                key={definition.id}
                                className="border-border/80 min-w-0 gap-4 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <CardHeader>
                                    <div className="bg-primary/10 text-primary mb-1 flex size-11 items-center justify-center rounded-xl">
                                        <Building2Icon className="size-5" aria-hidden />
                                    </div>
                                    <CardTitle className="break-words text-xl leading-snug">
                                        {definition.name}
                                    </CardTitle>
                                    {municipality ? (
                                        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                            <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
                                            <span className="break-words">{municipality}</span>
                                        </p>
                                    ) : null}
                                </CardHeader>
                                <CardContent className="mt-auto">
                                    <Button className="w-full" asChild>
                                        <Link
                                            to="/properties/$projectSlug"
                                            params={{ projectSlug: definition.id }}
                                        >
                                            View properties
                                            <ArrowRightIcon className="size-4" aria-hidden />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </LandingChrome>
    );
};

export default LandingPropertyProjects;
