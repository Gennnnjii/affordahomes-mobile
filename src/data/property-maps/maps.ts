import { dapdap1SitePlan } from "@/data/property-maps/dapdap-1";
import { dauSitePlan } from "@/data/property-maps/dau";
import { kayaHomesSitePlan } from "@/data/property-maps/kaya-homes";
import { porac2SitePlan } from "@/data/property-maps/porac-2";
import type { PropertyMapDefinition } from "@/types/property-site-plan";

export const PROPERTY_MAP_DEFINITIONS: readonly PropertyMapDefinition[] = [
    {
        id: "kaya-homes",
        name: "Kaya Homes",
        description: "Subdivision plan and vicinity map available.",
        availability: "available",
        sitePlan: kayaHomesSitePlan,
    },
    {
        id: "dapdap-1",
        name: "Dapdap 1",
        description: "Subdivision plan and vicinity map available.",
        availability: "available",
        sitePlan: dapdap1SitePlan,
    },
    {
        id: "dapdap-2",
        name: "Dapdap 2",
        description: "Interactive subdivision map coming soon.",
        availability: "coming-soon",
    },
    {
        id: "porac-1",
        name: "Porac 1",
        description: "Interactive subdivision map coming soon.",
        availability: "coming-soon",
    },
    {
        id: "porac-2",
        name: "Porac 2",
        description: "Subdivision plan and vicinity map available.",
        availability: "available",
        sitePlan: porac2SitePlan,
    },
    {
        id: "dau",
        name: "Dau",
        description: "Subdivision plan and vicinity map available.",
        availability: "available",
        sitePlan: dauSitePlan,
    },
];

export const findPropertyMapDefinition = (
    id: string | undefined,
): PropertyMapDefinition | undefined =>
    id ? PROPERTY_MAP_DEFINITIONS.find((definition) => definition.id === id) : undefined;
