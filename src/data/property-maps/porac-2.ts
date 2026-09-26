import type { PropertySitePlan } from "@/types/property-site-plan";

/**
 * Production SVG contract for FCI Porac 2.
 *
 * Exact boundaries, roads, and lots must be added only after controlled manual
 * tracing against the approved source plan. No approximate geometry belongs here.
 */
export const porac2SitePlan: PropertySitePlan = {
    id: "porac-2",
    name: "Porac 2",
    description:
        "Explore the Porac 2 subdivision layout and get a detailed view of its phases, residential blocks, roads, and surrounding community areas.",
    viewBox: [0, 0, 3819, 3314],
    backendProject: null,
    geometryStatus: "partial",
    expectedReferenceImagePath:
        "/property-maps/reference/porac-2/porac-2-masterplan.jpg",
    referenceImage: "/property-maps/reference/porac-2/porac-2-masterplan.jpg",
    showListingStatusLegend: true,
    sections: [
        {
            key: "2-a",
            name: "2-A",
            points: [
                [1450, 1375],
                [3310, 2290],
                [2610, 3310],
                [640, 2310],
            ],
            label: { x: 980, y: 1775 },
        },
        { key: "2-b", name: "2-B" },
        { key: "2-c", name: "2-C" },
    ],
    blocks: [
        {
            key: "2-a:block-14",
            section: "2-A",
            block: "14",
            label: { x: 2670, y: 2160 },
        },
    ],
    roads: [
        {
            key: "2-a:northern-existing-road",
            path: "M 1435 1435 C 1900 1560 2600 1940 3260 2260",
            width: 72,
            label: { x: 2525, y: 1855, text: "Existing Road" },
        },
        {
            key: "2-a:central-road",
            path: "M 2050 1640 C 2015 1835 1900 2050 1735 2260",
            width: 64,
        },
        {
            key: "2-a:west-road",
            path: "M 735 2295 C 1090 2340 1420 2315 1735 2260",
            width: 64,
        },
        {
            key: "2-a:southeast-road",
            path: "M 1735 2260 C 2075 2425 2525 2650 2930 2860",
            width: 64,
        },
        {
            key: "2-a:roundabout",
            path: "M 1790 2260 A 55 55 0 1 1 1680 2260 A 55 55 0 1 1 1790 2260",
            width: 38,
        },
    ],
    lots: [
        {
            key: "porac-2:2-a:block-14:lot-1",
            section: "2-A",
            block: "14",
            lotNumber: "1",
            points: [
                [2325, 1980],
                [2367, 2001],
                [2349, 2042],
                [2307, 2022],
            ],
            label: { x: 2337, y: 2011 },
        },
        {
            key: "porac-2:2-a:block-14:lot-2",
            section: "2-A",
            block: "14",
            lotNumber: "2",
            points: [
                [2367, 2001],
                [2396, 2014],
                [2378, 2055],
                [2349, 2042],
            ],
            label: { x: 2373, y: 2028 },
        },
        {
            key: "porac-2:2-a:block-14:lot-3",
            section: "2-A",
            block: "14",
            lotNumber: "3",
            points: [
                [2396, 2014],
                [2425, 2028],
                [2407, 2067],
                [2378, 2055],
            ],
            label: { x: 2402, y: 2041 },
        },
        {
            key: "porac-2:2-a:block-14:lot-4",
            section: "2-A",
            block: "14",
            lotNumber: "4",
            points: [
                [2425, 2028],
                [2452, 2041],
                [2434, 2080],
                [2407, 2067],
            ],
            label: { x: 2430, y: 2054 },
        },
        {
            key: "porac-2:2-a:block-14:lot-5",
            section: "2-A",
            block: "14",
            lotNumber: "5",
            points: [
                [2452, 2041],
                [2478, 2053],
                [2461, 2092],
                [2434, 2080],
            ],
            label: { x: 2456, y: 2067 },
        },
        {
            key: "porac-2:2-a:block-14:lot-6",
            section: "2-A",
            block: "14",
            lotNumber: "6",
            points: [
                [2478, 2053],
                [2503, 2065],
                [2486, 2104],
                [2461, 2092],
            ],
            label: { x: 2482, y: 2079 },
        },
        {
            key: "porac-2:2-a:block-14:lot-7",
            section: "2-A",
            block: "14",
            lotNumber: "7",
            points: [
                [2503, 2065],
                [2529, 2077],
                [2512, 2116],
                [2486, 2104],
            ],
            label: { x: 2508, y: 2091 },
        },
        {
            key: "porac-2:2-a:block-14:lot-8",
            section: "2-A",
            block: "14",
            lotNumber: "8",
            points: [
                [2529, 2077],
                [2554, 2089],
                [2537, 2128],
                [2512, 2116],
            ],
            label: { x: 2533, y: 2103 },
        },
        {
            key: "porac-2:2-a:block-14:lot-9",
            section: "2-A",
            block: "14",
            lotNumber: "9",
            points: [
                [2554, 2089],
                [2579, 2101],
                [2562, 2140],
                [2537, 2128],
            ],
            label: { x: 2558, y: 2115 },
        },
        {
            key: "porac-2:2-a:block-14:lot-10",
            section: "2-A",
            block: "14",
            lotNumber: "10",
            points: [
                [2579, 2101],
                [2605, 2114],
                [2587, 2153],
                [2562, 2140],
            ],
            label: { x: 2583, y: 2127 },
        },
    ],
};
