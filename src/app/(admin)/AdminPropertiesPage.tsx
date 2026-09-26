import { adminResourceApi } from "@/db/api/admin.api";
import { asRecord, idStr, str } from "@/lib/record";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { Link } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { normalizePropertyStatus, propertyStatusBadgeClass } from "@/lib/property-status";

type PropertyRow = Record<string, unknown>;

const propertyLocation = (row: PropertyRow) => {
    const project = str(row.project)?.trim() || undefined;
    const cityMunicipality = str(row.city_municipality)?.trim() || undefined;
    const province = str(row.province)?.trim() || undefined;

    if (cityMunicipality || province) {
        return [project, cityMunicipality, province].filter(Boolean).join(", ");
    }

    return str(row.address)?.trim() ?? "";
};

const columns: ColumnDef<PropertyRow>[] = [
    {
        id: "title",
        accessorFn: (row) => str(row.title) ?? "",
        header: "Title",
        cell: ({ getValue }) => (
            <span className="block truncate font-medium" title={(getValue() as string) || undefined}>
                {(getValue() as string) || "—"}
            </span>
        ),
        size: 200,
    },
    {
        id: "address",
        accessorFn: propertyLocation,
        header: "Address",
        cell: ({ getValue }) => (
            <span
                className="text-muted-foreground block truncate text-sm"
                title={(getValue() as string) || undefined}
            >
                {(getValue() as string) || "—"}
            </span>
        ),
        size: 260,
    },
    {
        id: "agent",
        accessorFn: (row) => {
            const agent = asRecord(row.agent);
            return `${str(agent.first_name) ?? ""} ${str(agent.last_name) ?? ""}`.trim();
        },
        header: "Agent",
        cell: ({ getValue }) => {
            const name = getValue() as string;
            return name ? (
                <span className="block truncate text-sm" title={name}>
                    {name}
                </span>
            ) : (
                <span className="text-muted-foreground text-xs italic">Unassigned</span>
            );
        },
        size: 168,
    },
    {
        id: "price",
        accessorFn: (row) => (row.price != null ? Number(row.price) : -1),
        header: "Price",
        cell: ({ row }) => (
            <span className="tabular-nums font-medium">
                {row.original.price != null
                    ? `₱${Number(row.original.price).toLocaleString()}`
                    : "—"}
            </span>
        ),
        size: 120,
    },
    {
        id: "status",
        accessorFn: (row) => str(row.status) ?? "",
        header: "Status",
        cell: ({ row }) => {
            const st = normalizePropertyStatus(str(row.original.status));
            return (
                <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold capitalize", propertyStatusBadgeClass(st))}>
                    {st}
                </span>
            );
        },
        size: 110,
    },
    {
        id: "actions",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
            const pk = idStr(row.original.id);
            return pk ? (
                <Button variant="outline" size="sm" asChild>
                    <Link
                        to="/admin/properties/$propertyId/update"
                        params={{ propertyId: pk }}
                    >
                        Update
                    </Link>
                </Button>
            ) : null;
        },
        size: 72,
    },
];

const AdminPropertiesPage = () => {
    const { data, isPending, isError } = useQuery({
        queryKey: ["admin", "properties"],
        queryFn: () => adminResourceApi.properties(),
        refetchInterval: 2_000,
    });

    const rows = useMemo<PropertyRow[]>(
        () => (data?.data as PropertyRow[] | undefined) ?? [],
        [data],
    );

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/admin" label="Dashboard" hideFrom="md" />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
                <Button asChild>
                    <Link to="/admin/properties/create">Create property</Link>
                </Button>
            </div>
            <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                {isPending ? (
                    <DataTableSkeleton columnCount={6} />
                ) : isError ? (
                    <p className="text-destructive p-6">Could not load properties.</p>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchPlaceholder="Search by title, address, agent, status…"
                    />
                )}
            </Card>
        </div>
    );
};

export default AdminPropertiesPage;
