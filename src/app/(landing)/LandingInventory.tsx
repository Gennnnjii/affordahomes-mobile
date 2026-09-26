import { LandingChrome } from "@/components/layout/LandingChrome";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { publicApi } from "@/db/api/public.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatPhpCurrency } from "@/lib/format-php-currency";
import { publicStorageUrl } from "@/lib/storage-url";
import { cn } from "@/lib/utils";
import type {
    DevelopmentProject,
    InventoryBlock,
    InventoryLotListParams,
    InventoryLotStatus,
    PropertyModel,
} from "@/types/inventory";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
    Building2Icon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CircleAlertIcon,
    HomeIcon,
    ImageIcon,
    Layers3Icon,
    MapIcon,
    MapPinIcon,
    RefreshCwIcon,
    RulerIcon,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const LOTS_PER_PAGE = 20;

const EMPTY_PROJECTS: DevelopmentProject[] = [];
const EMPTY_MODELS: PropertyModel[] = [];
const EMPTY_BLOCKS: InventoryBlock[] = [];

type InventoryBrowserSearch = {
    project?: string;
    model?: string;
    block?: string;
    status?: InventoryLotStatus;
    page: number;
};

const STATUS_OPTIONS: ReadonlyArray<{
    value: InventoryLotStatus;
    label: string;
}> = [
    { value: "available", label: "Available" },
    { value: "reserved", label: "Reserved" },
    { value: "sold", label: "Sold" },
    { value: "on_hold", label: "On hold" },
];

const STATUS_PRESENTATION: Record<
    InventoryLotStatus,
    { label: string; className: string }
> = {
    available: {
        label: "Available",
        className: "bg-emerald-100 text-emerald-800",
    },
    reserved: {
        label: "Reserved",
        className: "bg-amber-100 text-amber-800",
    },
    sold: {
        label: "Sold",
        className: "bg-slate-200 text-slate-700",
    },
    on_hold: {
        label: "On hold",
        className: "bg-orange-100 text-orange-800",
    },
};

const responseStatus = (error: unknown): number | undefined =>
    (error as { response?: { status?: number } })?.response?.status;

const retryTransportOrServerError = (failureCount: number, error: unknown): boolean => {
    const code = responseStatus(error);
    return (code === undefined || code >= 500) && failureCount < 1;
};

const sameSearchContext = (
    current: InventoryBrowserSearch,
    expected: InventoryBrowserSearch,
): boolean =>
    current.project === expected.project &&
    current.model === expected.model &&
    current.block === expected.block &&
    current.status === expected.status &&
    current.page === expected.page;

const ImageWithFallback = ({ src, alt }: { src?: string; alt: string }) => {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className="bg-muted flex size-full items-center justify-center">
                <ImageIcon className="text-muted-foreground/35 size-12" strokeWidth={1.25} aria-hidden />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className="size-full object-cover"
            onError={() => setFailed(true)}
        />
    );
};

const SectionSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
            <Card key={index} className="border-border/80 gap-4 p-5 shadow-sm">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-9 w-full" />
            </Card>
        ))}
    </div>
);

const EmptyState = ({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: typeof HomeIcon;
    title: string;
    description?: string;
    children?: React.ReactNode;
}) => (
    <Card className="border-border/80 items-center gap-3 px-6 py-12 text-center shadow-sm">
        <Icon className="text-muted-foreground/40 size-10" strokeWidth={1.25} aria-hidden />
        <div>
            <p className="font-medium">{title}</p>
            {description ? (
                <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-relaxed">
                    {description}
                </p>
            ) : null}
        </div>
        {children}
    </Card>
);

const ErrorState = ({
    error,
    onRetry,
    title = "This inventory information could not be loaded.",
}: {
    error: unknown;
    onRetry: () => void;
    title?: string;
}) => (
    <Card className="border-destructive/30 gap-3 p-5 shadow-sm">
        <div className="flex items-start gap-3">
            <CircleAlertIcon className="text-destructive mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
                <p className="font-medium">{title}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                    {getApiErrorMessage(error)}
                </p>
            </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry}>
            <RefreshCwIcon className="size-4" aria-hidden />
            Retry
        </Button>
    </Card>
);

const ModelFacts = ({ model }: { model: PropertyModel }) => {
    const facts = [
        model.floor_area_sqm ? `${model.floor_area_sqm} m² floor area` : null,
        model.bedrooms !== null ? `${model.bedrooms} bedroom${model.bedrooms === 1 ? "" : "s"}` : null,
        model.bathrooms !== null ? `${model.bathrooms} bathroom${model.bathrooms === 1 ? "" : "s"}` : null,
        model.parking ? `Parking: ${model.parking}` : null,
    ].filter((fact): fact is string => fact !== null);

    return facts.length > 0 ? (
        <ul className="text-muted-foreground space-y-1 text-sm">
            {facts.map((fact) => (
                <li key={fact}>{fact}</li>
            ))}
        </ul>
    ) : null;
};

const LandingInventory = () => {
    const navigate = useNavigate({ from: "/properties/inventory" });
    const { project, model, block, status, page } = useSearch({
        from: "/properties/inventory",
    });
    const currentSearchRef = useRef<InventoryBrowserSearch>({
        project,
        model,
        block,
        status,
        page,
    });
    const lotRecoveryInFlightRef = useRef<string | null>(null);
    const handledLotRecoveryRef = useRef<string | null>(null);
    const mountedRef = useRef(true);

    useLayoutEffect(() => {
        currentSearchRef.current = { project, model, block, status, page };
    }, [block, model, page, project, status]);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    const replaceSearch = useCallback(
        (next: InventoryBrowserSearch) => {
            void navigate({
                to: "/properties/inventory",
                search: next,
                replace: true,
            });
        },
        [navigate],
    );

    const pushSearch = (next: InventoryBrowserSearch) => {
        void navigate({ to: "/properties/inventory", search: next });
    };

    useEffect(() => {
        replaceSearch({ project, model, block, status, page });
    }, [block, model, page, project, replaceSearch, status]);

    const projectsQuery = useQuery({
        queryKey: ["public", "inventory", "projects"],
        queryFn: () => publicApi.inventoryProjects(),
    });

    const projects = projectsQuery.data?.data ?? EMPTY_PROJECTS;
    const selectedProject = useMemo(
        () => projects.find((candidate) => candidate.id === project),
        [project, projects],
    );

    const modelsQuery = useQuery({
        queryKey: ["public", "inventory", "project", selectedProject?.id ?? null, "models"],
        queryFn: () => {
            if (!selectedProject) throw new Error("Inventory project unavailable.");
            return publicApi.inventoryProjectModels(selectedProject.id);
        },
        enabled: Boolean(selectedProject),
        retry: retryTransportOrServerError,
    });

    const blocksQuery = useQuery({
        queryKey: ["public", "inventory", "project", selectedProject?.id ?? null, "blocks"],
        queryFn: () => {
            if (!selectedProject) throw new Error("Inventory project unavailable.");
            return publicApi.inventoryProjectBlocks(selectedProject.id);
        },
        enabled: Boolean(selectedProject),
        retry: retryTransportOrServerError,
    });

    const models = modelsQuery.data?.data ?? EMPTY_MODELS;
    const blocks = blocksQuery.data?.data ?? EMPTY_BLOCKS;
    const selectedModel = useMemo(
        () => models.find((candidate) => candidate.id === model),
        [model, models],
    );
    const selectedBlock = useMemo(
        () => blocks.find((candidate) => candidate.id === block),
        [block, blocks],
    );

    const lotParams = useMemo<InventoryLotListParams>(
        () => ({
            page,
            per_page: LOTS_PER_PAGE,
            ...(selectedModel ? { property_model_id: selectedModel.id } : {}),
            ...(status ? { status } : {}),
        }),
        [page, selectedModel, status],
    );

    const lotsEnabled = Boolean(selectedBlock && (!model || selectedModel));
    const lotsQuery = useQuery({
        queryKey: [
            "public",
            "inventory",
            "block",
            selectedBlock?.id ?? null,
            "lots",
            {
                propertyModelId: selectedModel?.id,
                status,
                page,
                perPage: LOTS_PER_PAGE,
            },
        ],
        queryFn: () => {
            if (!selectedBlock) throw new Error("Inventory block unavailable.");
            return publicApi.inventoryBlockLots(selectedBlock.id, lotParams);
        },
        enabled: lotsEnabled,
        refetchOnWindowFocus: true,
        refetchInterval: 15_000,
        retry: retryTransportOrServerError,
    });
    const refetchProjects = projectsQuery.refetch;
    const refetchModels = modelsQuery.refetch;
    const refetchBlocks = blocksQuery.refetch;

    useEffect(() => {
        if (
            lotRecoveryInFlightRef.current ||
            !projectsQuery.isSuccess ||
            !project ||
            selectedProject
        ) {
            return;
        }

        replaceSearch({ page: 1 });
    }, [project, projectsQuery.isSuccess, replaceSearch, selectedProject]);

    useEffect(() => {
        const childNotFound =
            (modelsQuery.isError && responseStatus(modelsQuery.error) === 404) ||
            (blocksQuery.isError && responseStatus(blocksQuery.error) === 404);

        if (lotRecoveryInFlightRef.current || !selectedProject || !childNotFound) return;

        replaceSearch({ page: 1 });
    }, [
        blocksQuery.error,
        blocksQuery.isError,
        modelsQuery.error,
        modelsQuery.isError,
        replaceSearch,
        selectedProject,
    ]);

    useEffect(() => {
        if (
            lotRecoveryInFlightRef.current ||
            !selectedProject ||
            !model ||
            !modelsQuery.isSuccess ||
            selectedModel
        ) {
            return;
        }

        replaceSearch({ project: selectedProject.id, block, status, page: 1 });
    }, [
        block,
        model,
        modelsQuery.isSuccess,
        replaceSearch,
        selectedModel,
        selectedProject,
        status,
    ]);

    useEffect(() => {
        if (
            lotRecoveryInFlightRef.current ||
            !selectedProject ||
            !block ||
            !blocksQuery.isSuccess ||
            selectedBlock
        ) {
            return;
        }

        replaceSearch({
            project: selectedProject.id,
            model: selectedModel?.id,
            status,
            page: 1,
        });
    }, [
        block,
        blocksQuery.isSuccess,
        replaceSearch,
        selectedBlock,
        selectedModel,
        selectedProject,
        status,
    ]);

    useEffect(() => {
        if (!lotsQuery.isError) return;

        const code = responseStatus(lotsQuery.error);
        if (
            code === 404 &&
            project &&
            block &&
            selectedProject?.id === project &&
            selectedBlock?.id === block &&
            (!model || selectedModel?.id === model)
        ) {
            const failedContext: InventoryBrowserSearch = {
                project,
                model,
                block,
                status,
                page,
            };
            const recoveryKey = `${JSON.stringify(failedContext)}:${lotsQuery.errorUpdatedAt}`;

            if (
                lotRecoveryInFlightRef.current === recoveryKey ||
                handledLotRecoveryRef.current === recoveryKey
            ) {
                return;
            }

            lotRecoveryInFlightRef.current = recoveryKey;

            void (async () => {
                try {
                    const refreshedProjects = await refetchProjects();
                    if (
                        !mountedRef.current ||
                        !sameSearchContext(currentSearchRef.current, failedContext) ||
                        !refreshedProjects.isSuccess
                    ) {
                        return;
                    }

                    const projectStillExists = refreshedProjects.data.data.some(
                        (candidate) => candidate.id === failedContext.project,
                    );
                    if (!projectStillExists) {
                        replaceSearch({ page: 1 });
                        return;
                    }

                    const [refreshedModels, refreshedBlocks] = await Promise.all([
                        refetchModels(),
                        refetchBlocks(),
                    ]);
                    if (
                        !mountedRef.current ||
                        !sameSearchContext(currentSearchRef.current, failedContext) ||
                        !refreshedModels.isSuccess ||
                        !refreshedBlocks.isSuccess
                    ) {
                        return;
                    }

                    const modelIsStale = Boolean(
                        failedContext.model &&
                            !refreshedModels.data.data.some(
                                (candidate) => candidate.id === failedContext.model,
                            ),
                    );
                    const blockIsStale = !refreshedBlocks.data.data.some(
                        (candidate) => candidate.id === failedContext.block,
                    );

                    if (!modelIsStale && !blockIsStale) return;

                    replaceSearch({
                        project: failedContext.project,
                        model: modelIsStale ? undefined : failedContext.model,
                        block: blockIsStale ? undefined : failedContext.block,
                        status: failedContext.status,
                        page: 1,
                    });
                } catch {
                    // Query state owns sanitized failure presentation; recovery preserves the URL.
                } finally {
                    if (lotRecoveryInFlightRef.current === recoveryKey) {
                        handledLotRecoveryRef.current = recoveryKey;
                        lotRecoveryInFlightRef.current = null;
                    }
                }
            })();
        } else if (code === 422 && (status !== undefined || page !== 1)) {
            replaceSearch({
                project: selectedProject?.id,
                model: selectedModel?.id,
                block: selectedBlock?.id,
                page: 1,
            });
        }
    }, [
        lotsQuery.error,
        lotsQuery.errorUpdatedAt,
        lotsQuery.isError,
        model,
        page,
        project,
        refetchBlocks,
        refetchModels,
        refetchProjects,
        replaceSearch,
        block,
        selectedBlock,
        selectedModel,
        selectedProject,
        status,
    ]);

    const lotResult = lotsQuery.data?.data;
    useEffect(() => {
        if (!lotResult || page <= Math.max(1, lotResult.pagination.last_page)) return;

        replaceSearch({
            project: selectedProject?.id,
            model: selectedModel?.id,
            block: selectedBlock?.id,
            status,
            page: Math.max(1, lotResult.pagination.last_page),
        });
    }, [
        lotResult,
        page,
        replaceSearch,
        selectedBlock,
        selectedModel,
        selectedProject,
        status,
    ]);

    const modelById = useMemo(
        () => new Map(models.map((candidate) => [candidate.id, candidate])),
        [models],
    );
    const hasLotFilters = Boolean(selectedModel || status);
    const projectChildrenNotFound =
        (modelsQuery.isError && responseStatus(modelsQuery.error) === 404) ||
        (blocksQuery.isError && responseStatus(blocksQuery.error) === 404);
    const lotErrorCode = lotsQuery.isError ? responseStatus(lotsQuery.error) : undefined;
    const recoveryNotice =
        projectsQuery.isSuccess && project && !selectedProject
            ? "That inventory project is no longer available."
            : selectedProject && projectChildrenNotFound
              ? "That inventory project is no longer available."
              : selectedProject && model && modelsQuery.isSuccess && !selectedModel
                ? "That property model is no longer available."
                : selectedProject && block && blocksQuery.isSuccess && !selectedBlock
                  ? "That inventory block is no longer available."
                  : lotErrorCode === 404
                    ? "The selected inventory context could not be loaded and was revalidated."
                    : lotErrorCode === 422
                      ? "The inventory filters were reset because they were no longer valid."
                      : null;

    return (
        <LandingChrome>
            <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-12 lg:px-14">
                <ScreenBackLink to="/properties" label="Properties" />

                <header className="space-y-3">
                    <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                        Live normalized inventory
                    </p>
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
                            <Building2Icon className="size-6" aria-hidden />
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                Browse homes and physical Lots
                            </h1>
                            <p className="text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                                Explore authoritative Projects, home models, Blocks, and current Lot
                                availability. Viewing a Lot does not reserve or hold it.
                            </p>
                        </div>
                    </div>
                </header>

                {recoveryNotice ? (
                    <div
                        className="border-primary/25 bg-primary/5 text-foreground rounded-lg border px-4 py-3 text-sm"
                        role="status"
                    >
                        {recoveryNotice}
                    </div>
                ) : null}

                <section className="space-y-5" aria-labelledby="inventory-projects-heading">
                    <div>
                        <p className="text-primary text-xs font-semibold tracking-wide uppercase">Step 1</p>
                        <h2 id="inventory-projects-heading" className="mt-1 text-2xl font-semibold">
                            Choose a development project
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Projects shown here come directly from the live inventory catalog.
                        </p>
                    </div>

                    {projectsQuery.isPending ? (
                        <SectionSkeleton />
                    ) : projectsQuery.isError ? (
                        <ErrorState
                            error={projectsQuery.error}
                            onRetry={() => void projectsQuery.refetch()}
                            title="Projects could not be loaded."
                        />
                    ) : projects.length === 0 ? (
                        <EmptyState
                            icon={Building2Icon}
                            title="No live inventory projects are currently published."
                            description="You can still browse legacy Property listings or view the non-authoritative subdivision plans."
                        >
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <Button variant="outline" asChild>
                                    <Link to="/properties">Browse legacy Properties</Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link to="/properties/map" search={{}}>
                                        <MapIcon className="size-4" aria-hidden />
                                        Property Map
                                    </Link>
                                </Button>
                            </div>
                        </EmptyState>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map((candidate) => {
                                const isSelected = candidate.id === selectedProject?.id;
                                const location = [candidate.city_municipality, candidate.province]
                                    .filter(Boolean)
                                    .join(", ");

                                return (
                                    <Card
                                        key={candidate.id}
                                        className={cn(
                                            "border-border/80 gap-4 p-5 shadow-sm transition-colors",
                                            isSelected && "border-primary ring-primary/20 ring-2",
                                        )}
                                    >
                                        <CardHeader className="gap-2 p-0">
                                            <CardTitle className="text-lg leading-snug">
                                                {candidate.name}
                                            </CardTitle>
                                            <p className="text-muted-foreground flex items-start gap-1.5 text-sm">
                                                <MapPinIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                                                <span>{location}</span>
                                            </p>
                                        </CardHeader>
                                        {candidate.address_context ? (
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                {candidate.address_context}
                                            </p>
                                        ) : null}
                                        <Button
                                            type="button"
                                            variant={isSelected ? "default" : "outline"}
                                            className="mt-auto w-full"
                                            onClick={() =>
                                                isSelected
                                                    ? pushSearch({ page: 1 })
                                                    : pushSearch({
                                                          project: candidate.id,
                                                          page: 1,
                                                      })
                                            }
                                        >
                                            {isSelected ? "Clear project" : "Explore project"}
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </section>

                {selectedProject ? (
                    <>
                        <section className="space-y-5" aria-labelledby="inventory-models-heading">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                                        Step 2 · Optional Lot filter
                                    </p>
                                    <h2 id="inventory-models-heading" className="mt-1 text-2xl font-semibold">
                                        Browse property models
                                    </h2>
                                    <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
                                        Models describe shared home specifications. They are not physical
                                        parents of Blocks.
                                    </p>
                                </div>
                                {selectedModel ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            pushSearch({
                                                project: selectedProject.id,
                                                block: selectedBlock?.id,
                                                status,
                                                page: 1,
                                            })
                                        }
                                    >
                                        Show all models
                                    </Button>
                                ) : null}
                            </div>

                            {modelsQuery.isPending ? (
                                <SectionSkeleton />
                            ) : modelsQuery.isError ? (
                                <ErrorState
                                    error={modelsQuery.error}
                                    onRetry={() => void modelsQuery.refetch()}
                                    title="Property models could not be loaded."
                                />
                            ) : models.length === 0 ? (
                                <EmptyState
                                    icon={HomeIcon}
                                    title="No property models are currently published for this project."
                                />
                            ) : (
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {models.map((candidate) => {
                                        const isSelected = candidate.id === selectedModel?.id;
                                        const features = candidate.included_features ?? [];

                                        return (
                                            <Card
                                                key={candidate.id}
                                                className={cn(
                                                    "border-border/80 overflow-hidden rounded-xl p-0 shadow-sm transition-colors",
                                                    isSelected && "border-primary ring-primary/20 ring-2",
                                                )}
                                            >
                                                <div className="aspect-[4/3] overflow-hidden">
                                                    <ImageWithFallback
                                                        src={publicStorageUrl(candidate.main_image)}
                                                        alt={candidate.name}
                                                    />
                                                </div>
                                                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">{candidate.name}</h3>
                                                        <p className="text-muted-foreground mt-1 line-clamp-3 text-sm leading-relaxed">
                                                            {candidate.description}
                                                        </p>
                                                    </div>
                                                    <ModelFacts model={candidate} />
                                                    {features.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {features.map((feature) => (
                                                                <span
                                                                    key={feature}
                                                                    className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs"
                                                                >
                                                                    {feature}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                    <p className="mt-auto text-sm">
                                                        <span className="text-muted-foreground">Model base price: </span>
                                                        <span className="text-primary font-semibold">
                                                            {candidate.base_price !== null
                                                                ? formatPhpCurrency(candidate.base_price)
                                                                : "Not published"}
                                                        </span>
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        variant={isSelected ? "default" : "outline"}
                                                        onClick={() =>
                                                            pushSearch({
                                                                project: selectedProject.id,
                                                                model: candidate.id,
                                                                block: selectedBlock?.id,
                                                                status,
                                                                page: 1,
                                                            })
                                                        }
                                                    >
                                                        {isSelected ? "Model filter selected" : "Filter Lots by model"}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="space-y-5" aria-labelledby="inventory-blocks-heading">
                            <div>
                                <p className="text-primary text-xs font-semibold tracking-wide uppercase">Step 3</p>
                                <h2 id="inventory-blocks-heading" className="mt-1 text-2xl font-semibold">
                                    Choose a physical Block
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Blocks group physical Lots within {selectedProject.name}. No Model
                                    availability is inferred before a Block is opened.
                                </p>
                            </div>

                            {blocksQuery.isPending ? (
                                <SectionSkeleton />
                            ) : blocksQuery.isError ? (
                                <ErrorState
                                    error={blocksQuery.error}
                                    onRetry={() => void blocksQuery.refetch()}
                                    title="Inventory Blocks could not be loaded."
                                />
                            ) : blocks.length === 0 ? (
                                <EmptyState
                                    icon={Layers3Icon}
                                    title="No inventory blocks are currently published for this project."
                                />
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {blocks.map((candidate) => {
                                        const isSelected = candidate.id === selectedBlock?.id;

                                        return (
                                            <Card
                                                key={candidate.id}
                                                className={cn(
                                                    "border-border/80 gap-4 p-5 shadow-sm transition-colors",
                                                    isSelected && "border-primary ring-primary/20 ring-2",
                                                )}
                                            >
                                                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                                                    <Layers3Icon className="size-5" aria-hidden />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{candidate.display_label}</h3>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        Identifier: {candidate.canonical_identifier}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant={isSelected ? "default" : "outline"}
                                                    className="mt-auto"
                                                    onClick={() =>
                                                        isSelected
                                                            ? pushSearch({
                                                                  project: selectedProject.id,
                                                                  model: selectedModel?.id,
                                                                  status,
                                                                  page: 1,
                                                              })
                                                            : pushSearch({
                                                                  project: selectedProject.id,
                                                                  model: selectedModel?.id,
                                                                  block: candidate.id,
                                                                  status,
                                                                  page: 1,
                                                              })
                                                    }
                                                >
                                                    {isSelected ? "Clear Block" : "View Lots"}
                                                </Button>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="space-y-5" aria-labelledby="inventory-lots-heading">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <p className="text-primary text-xs font-semibold tracking-wide uppercase">Step 4</p>
                                    <h2 id="inventory-lots-heading" className="mt-1 text-2xl font-semibold">
                                        Browse physical Lots
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {selectedBlock
                                            ? `Current inventory in ${selectedBlock.display_label}.`
                                            : "Choose a Block to view its authoritative Lot inventory."}
                                    </p>
                                </div>

                                {selectedBlock ? (
                                    <div className="w-full sm:w-48">
                                        <Select
                                            value={status ?? "all"}
                                            onValueChange={(value) =>
                                                pushSearch({
                                                    project: selectedProject.id,
                                                    model: selectedModel?.id,
                                                    block: selectedBlock.id,
                                                    status:
                                                        value === "all"
                                                            ? undefined
                                                            : (value as InventoryLotStatus),
                                                    page: 1,
                                                })
                                            }
                                        >
                                            <SelectTrigger aria-label="Filter Lots by status">
                                                <SelectValue placeholder="All statuses" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All statuses</SelectItem>
                                                {STATUS_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : null}
                            </div>

                            {!selectedBlock ? (
                                <EmptyState
                                    icon={Layers3Icon}
                                    title="Choose a Block to browse its Lots."
                                    description="Property Models can optionally filter the Lot results after a physical Block is selected."
                                />
                            ) : lotsQuery.isPending ? (
                                <SectionSkeleton count={6} />
                            ) : lotsQuery.isError ? (
                                <ErrorState
                                    error={lotsQuery.error}
                                    onRetry={() => void lotsQuery.refetch()}
                                    title="Authoritative Lot inventory could not be loaded."
                                />
                            ) : !lotResult || lotResult.items.length === 0 ? (
                                <EmptyState
                                    icon={HomeIcon}
                                    title={
                                        hasLotFilters
                                            ? "No Lots match the selected Model/status filters."
                                            : "No Lots are currently published for this Block."
                                    }
                                />
                            ) : (
                                <>
                                    <div className="border-primary/20 bg-primary/5 rounded-lg border px-4 py-3 text-sm">
                                        Viewing a Lot does not reserve or hold it. Availability may change until
                                        confirmed through the proper reservation process.
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {lotResult.items.map((lot) => {
                                            const linkedModel = modelById.get(lot.property_model_id);
                                            const presentation = STATUS_PRESENTATION[lot.status];

                                            return (
                                                <Card
                                                    key={lot.id}
                                                    className={cn(
                                                        "border-border/80 gap-4 p-5 shadow-sm",
                                                        !lot.is_available && "bg-muted/30",
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                                                {selectedBlock.display_label}
                                                            </p>
                                                            <h3 className="mt-1 text-lg font-semibold">
                                                                Lot {lot.display_lot_identifier}
                                                            </h3>
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                                                                presentation.className,
                                                            )}
                                                        >
                                                            {presentation.label}
                                                        </span>
                                                    </div>

                                                    <div className="text-muted-foreground space-y-2 text-sm">
                                                        <p className="flex items-center gap-2">
                                                            <HomeIcon className="text-primary size-4 shrink-0" aria-hidden />
                                                            <span>{linkedModel?.name ?? "Model unavailable"}</span>
                                                        </p>
                                                        <p className="flex items-center gap-2">
                                                            <RulerIcon className="text-primary size-4 shrink-0" aria-hidden />
                                                            <span>
                                                                {lot.lot_area_sqm !== null
                                                                    ? `${lot.lot_area_sqm} m² Lot area`
                                                                    : "Lot area not published"}
                                                            </span>
                                                        </p>
                                                    </div>

                                                    <div className="border-border mt-auto border-t pt-4">
                                                        <p className="text-muted-foreground text-xs">Effective Lot price</p>
                                                        <p className="text-primary mt-1 text-lg font-bold">
                                                            {formatPhpCurrency(lot.effective_price)}
                                                        </p>
                                                        <p className="text-muted-foreground mt-1 text-xs">
                                                            Server-derived authoritative price
                                                        </p>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>

                                    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                                        <p className="text-muted-foreground text-sm">
                                            Page {lotResult.pagination.current_page} of{" "}
                                            {lotResult.pagination.last_page} · {lotResult.pagination.total}{" "}
                                            {lotResult.pagination.total === 1 ? "Lot" : "Lots"}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={lotResult.pagination.current_page <= 1}
                                                onClick={() =>
                                                    pushSearch({
                                                        project: selectedProject.id,
                                                        model: selectedModel?.id,
                                                        block: selectedBlock.id,
                                                        status,
                                                        page: Math.max(1, page - 1),
                                                    })
                                                }
                                            >
                                                <ChevronLeftIcon className="size-4" aria-hidden />
                                                Previous
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    lotResult.pagination.current_page >=
                                                    lotResult.pagination.last_page
                                                }
                                                onClick={() =>
                                                    pushSearch({
                                                        project: selectedProject.id,
                                                        model: selectedModel?.id,
                                                        block: selectedBlock.id,
                                                        status,
                                                        page: page + 1,
                                                    })
                                                }
                                            >
                                                Next
                                                <ChevronRightIcon className="size-4" aria-hidden />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>
                    </>
                ) : null}
            </div>
        </LandingChrome>
    );
};

export default LandingInventory;
