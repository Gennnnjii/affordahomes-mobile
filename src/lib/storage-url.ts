const base = () => import.meta.env.VITE_BACKEND_BASE_URL?.replace(/\/$/, "") ?? "";

export function publicStorageUrl(path: string | null | undefined): string | undefined {
    if (path == null || path === "") return undefined;
    return `${base()}/storage/${path.replace(/^\//, "")}`;
}
