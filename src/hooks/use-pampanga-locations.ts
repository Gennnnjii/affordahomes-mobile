import { publicApi } from "@/db/api/public.api";
import { useQuery } from "@tanstack/react-query";

export const pampangaLocationsQueryKey = ["public", "locations", "pampanga"] as const;

export const usePampangaLocations = () =>
    useQuery({
        queryKey: pampangaLocationsQueryKey,
        queryFn: () => publicApi.pampangaLocations(),
        staleTime: 5 * 60 * 1000,
    });
