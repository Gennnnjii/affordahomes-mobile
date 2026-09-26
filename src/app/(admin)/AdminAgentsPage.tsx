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

type AgentRow = Record<string, unknown>;

const columns: ColumnDef<AgentRow>[] = [
    {
        id: "employee_id",
        accessorFn: (row) => str(row.employee_id) ?? "",
        header: "Employee ID",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground font-mono text-xs">
                {(getValue() as string) || "—"}
            </span>
        ),
        size: 130,
    },
    {
        id: "name",
        accessorFn: (row) =>
            `${str(row.first_name) ?? ""} ${str(row.last_name) ?? ""}`.trim(),
        header: "Name",
        cell: ({ getValue }) => (
            <span className="font-medium">{(getValue() as string) || "—"}</span>
        ),
    },
    {
        id: "email",
        accessorFn: (row) => str(row.email) ?? "",
        header: "Email",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground text-sm">{(getValue() as string) || "—"}</span>
        ),
    },
    {
        id: "age",
        accessorFn: (row) => (row.age != null ? Number(row.age) : -1),
        header: "Age",
        cell: ({ row }) => (
            <span className="tabular-nums">
                {row.original.age != null ? String(row.original.age) : "—"}
            </span>
        ),
        size: 72,
    },
    {
        id: "employment_type",
        accessorFn: (row) => str(row.employment_type) ?? "",
        header: "Type",
        cell: ({ row }) => {
            const t = str(row.original.employment_type) ?? "full_time";
            return (
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t === "part_time"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}>
                    {t === "part_time" ? "Part-time" : "Full-time"}
                </span>
            );
        },
        size: 100,
    },
    {
        id: "quota",
        accessorFn: (row) => (row.monthly_quota != null ? Number(row.monthly_quota) : -1),
        header: "Quota / mo",
        cell: ({ row }) => {
            const q = row.original.monthly_quota;
            return (
                <span className="tabular-nums text-sm">
                    {q != null ? `${q} units` : "—"}
                </span>
            );
        },
        size: 100,
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
                    <Link to="/admin/agents/$agentId/update" params={{ agentId: pk }}>
                        Edit
                    </Link>
                </Button>
            ) : null;
        },
        size: 72,
    },
];

const AdminAgentsPage = () => {
    const { data, isPending, isError } = useQuery({
        queryKey: ["admin", "agents"],
        queryFn: () => adminResourceApi.agents(),
        refetchInterval: 2_000,
    });

    const rows = useMemo<AgentRow[]>(
        () => (data?.data as AgentRow[] | undefined) ?? [],
        [data],
    );

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/admin" label="Dashboard" hideFrom="md" />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
                <Button asChild>
                    <Link to="/admin/agents/create">Create agent</Link>
                </Button>
            </div>
            <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                {isPending ? (
                    <DataTableSkeleton columnCount={5} />
                ) : isError ? (
                    <p className="text-destructive p-6">Could not load agents.</p>
                ) : (
                    <DataTable columns={columns} data={rows} searchPlaceholder="Search agents…" />
                )}
            </Card>
        </div>
    );
};

export default AdminAgentsPage;
