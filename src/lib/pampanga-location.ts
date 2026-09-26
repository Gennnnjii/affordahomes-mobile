import type { PampangaLocationCatalog } from "@/types/pampanga-location";

const clean = (value: unknown): string | null =>
    typeof value === "string" && value.trim() ? value.trim() : null;

export const projectsForCity = (
    catalog: PampangaLocationCatalog | undefined,
    city: string,
): string[] => (city ? (catalog?.projects_by_city[city] ?? []) : []);

export const allCatalogProjects = (
    catalog: PampangaLocationCatalog | undefined,
): string[] =>
    catalog
        ? catalog.city_municipalities.flatMap(
              (city) => catalog.projects_by_city[city] ?? [],
          )
        : [];

export const isCanonicalLocation = (
    catalog: PampangaLocationCatalog | undefined,
    province: unknown,
    city: unknown,
    project: unknown,
): boolean => {
    const normalizedProvince = clean(province);
    const normalizedCity = clean(city);
    const normalizedProject = clean(project);

    return Boolean(
        catalog &&
            normalizedProvince === catalog.province &&
            normalizedCity &&
            normalizedProject &&
            projectsForCity(catalog, normalizedCity).includes(normalizedProject),
    );
};

export const propertyLocationDisplay = (property: Record<string, unknown>) => {
    const project = clean(property.project);
    const province = clean(property.province);
    const city = clean(property.city_municipality);
    const address = clean(property.address);
    const locality = city && province ? `${city}, ${province}` : null;

    return {
        project,
        locality,
        address,
        isClassified: Boolean(locality),
    };
};
