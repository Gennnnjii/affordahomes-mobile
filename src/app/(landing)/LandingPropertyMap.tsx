import { LandingChrome } from "@/components/layout/LandingChrome";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyMapCatalog } from "@/app/(landing)/property-map/PropertyMapCatalog";
import { PropertySitePlanViewer } from "@/app/(landing)/property-map/PropertySitePlanViewer";
import {
    findPropertyMapDefinition,
    PROPERTY_MAP_DEFINITIONS,
} from "@/data/property-maps/maps";
import { Link, useSearch } from "@tanstack/react-router";
import { ChevronRightIcon, MapIcon } from "lucide-react";

const LandingPropertyMap = () => {
    const { map } = useSearch({ from: "/properties/map" });
    const selectedMap = findPropertyMapDefinition(map);

    return (
        <LandingChrome>
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-12 lg:px-14">
                <ScreenBackLink to="/properties" label="Properties" />

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <MapIcon className="text-primary size-7 shrink-0" aria-hidden />
                        <h1 className="text-3xl font-semibold tracking-tight">Property Map</h1>
                    </div>
                    <p className="text-muted-foreground max-w-3xl">
                        Choose a subdivision and inspect its Project, Block, and Lot site plan.
                    </p>
                </div>

                {map && (
                    <nav
                        aria-label="Property map breadcrumb"
                        className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm"
                    >
                        <Link
                            to="/properties/map"
                            search={{}}
                            className="hover:text-foreground transition-colors"
                        >
                            All maps
                        </Link>
                        <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden />
                        <span className="text-foreground break-words font-medium">
                            {selectedMap?.name ?? "Unknown map"}
                        </span>
                    </nav>
                )}

                {!map ? (
                    <PropertyMapCatalog definitions={PROPERTY_MAP_DEFINITIONS} />
                ) : !selectedMap ? (
                    <Card>
                        <CardContent className="space-y-4 text-center">
                            <p className="text-muted-foreground">
                                This subdivision map is not available.
                            </p>
                            <Button variant="outline" asChild>
                                <Link to="/properties/map" search={{}}>
                                    View all maps
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : !selectedMap.sitePlan ? (
                    <Card>
                        <CardContent className="space-y-4 text-center">
                            <p className="text-muted-foreground">
                                The {selectedMap.name} interactive map is coming soon.
                            </p>
                            <Button variant="outline" asChild>
                                <Link to="/properties/map" search={{}}>
                                    View all maps
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <PropertySitePlanViewer sitePlan={selectedMap.sitePlan} />
                )}
            </div>
        </LandingChrome>
    );
};

export default LandingPropertyMap;
