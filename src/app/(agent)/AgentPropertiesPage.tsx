import { agentPortalApi } from "@/db/api/agent.portal.api";
import { formatPhpCurrency } from "@/lib/format-php-currency";
import { idStr, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { HomeIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { normalizePropertyStatus, propertyStatusBadgeClass, propertyStatusLabel } from "@/lib/property-status";

type PropertyRow = Record<string, unknown>;

const baseColumns: ColumnDef<PropertyRow>[] = [
    {
        id: "image",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
            const imgSrc = publicStorageUrl(str(row.original.main_image));
            return imgSrc ? (
                <img src={imgSrc} alt="" className="size-10 rounded-md object-cover" />
            ) : (
                <div className="bg-muted flex size-10 items-center justify-center rounded-md">
                    <HomeIcon className="text-muted-foreground size-4" />
                </div>
            );
        },
        size: 56,
    },
    {
        id: "title",
        accessorFn: (row) => str(row.title) ?? "",
        header: "Title",
        cell: ({ getValue }) => (
            <span className="font-medium">{(getValue() as string) || "—"}</span>
        ),
    },
    {
        id: "project",
        accessorFn: (row) => str(row.project) ?? "",
        header: "Project",
        cell: ({ row }) => {
            const proj = str(row.original.project);
            const blk = str(row.original.block);
            const lot = str(row.original.lot_number);
            const sub = [blk ? `Blk ${blk}` : null, lot ? `Lot ${lot}` : null].filter(Boolean).join(" ");
            return (
                <div className="text-sm">
                    {proj ? <span className="font-medium">{proj}</span> : <span className="text-muted-foreground">—</span>}
                    {sub && <span className="text-muted-foreground ml-1 text-xs">{sub}</span>}
                </div>
            );
        },
    },
    {
        id: "address",
        accessorFn: (row) => str(row.address) ?? "",
        header: "Address",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground max-w-[180px] truncate block text-sm">
                {(getValue() as string) || "—"}
            </span>
        ),
    },
    {
        id: "price",
        accessorFn: (row) => (row.price != null ? Number(row.price) : -1),
        header: "Price",
        cell: ({ row }) => (
            <span className="text-primary font-semibold text-sm">
                {row.original.price != null ? formatPhpCurrency(Number(row.original.price)) : "—"}
            </span>
        ),
        size: 130,
    },
    {
        id: "status",
        accessorFn: (row) => normalizePropertyStatus(str(row.status)),
        header: "Status",
        cell: ({ row }) => {
            const st = normalizePropertyStatus(str(row.original.status));
            return (
                <span
                    className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
                        propertyStatusBadgeClass(st),
                    )}
                >
                    {propertyStatusLabel(st)}
                </span>
            );
        },
        size: 100,
    },
];

const AgentPropertiesPage = () => {
    const { data, isPending, isError } = useQuery({
        queryKey: ["agent", "properties"],
        queryFn: () => agentPortalApi.properties(),
        refetchInterval: 2_000,
    });

    const columns = useMemo<ColumnDef<PropertyRow>[]>(
        () => [
            ...baseColumns,
            {
                id: "actions",
                header: "",
                enableSorting: false,
                enableGlobalFilter: false,
                cell: ({ row }) => {
                    const propertyId = idStr(row.original.id);
                    if (!propertyId) return null;

                    return (
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    to="/dashboard/agent/properties/$propertyId"
                                    params={{ propertyId }}
                                >
                                    View
                                </Link>
                            </Button>
                        </div>
                    );
                },
                size: 88,
            },
        ],
        [],
    );

    const rows = useMemo<PropertyRow[]>(
        () => (data?.data as PropertyRow[] | undefined) ?? [],
        [data],
    );

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/agent" label="Dashboard" hideFrom="md" />
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        View the AFFORDAHOMES properties assigned to your account.
                    </p>
                </div>
            </div>

            <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                {isPending ? (
                    <DataTableSkeleton columnCount={7} />
                ) : isError ? (
                    <p className="text-destructive p-6">Could not load properties.</p>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchPlaceholder="Search by title, project, address, status…"
                    />
                )}
            </Card>

        </div>
    );
};

export default AgentPropertiesPage;
