import { agentPortalApi } from "@/db/api/agent.portal.api";
import { asRecord, idStr, str } from "@/lib/record";
import { formatPhpCurrency } from "@/lib/format-php-currency";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { CheckCircle2Icon, FileTextIcon, XCircleIcon } from "lucide-react";

type PrequalRow = Record<string, unknown>;

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    qualified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    not_qualified: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const employmentLabels: Record<string, string> = {
    employed: "Employed",
    self_employed: "Self-employed",
    unemployed: "Unemployed",
};

const DocPresent = ({ value }: { value: unknown }) =>
    value ? (
        <CheckCircle2Icon className="size-4 text-green-600 dark:text-green-400" />
    ) : (
        <XCircleIcon className="text-muted-foreground size-4" />
    );

const columns: ColumnDef<PrequalRow>[] = [
    {
        id: "client",
        accessorFn: (row) => {
            const c = asRecord(row.client);
            return `${str(c.first_name) ?? ""} ${str(c.last_name) ?? ""}`.trim() || str(c.email) || "";
        },
        header: "Client",
        cell: ({ getValue }) => (
            <span className="font-medium">{(getValue() as string) || "—"}</span>
        ),
    },
    {
        id: "employment_status",
        accessorFn: (row) => str(row.employment_status) ?? "",
        header: "Employment",
        cell: ({ getValue }) => (
            <span className="text-sm">
                {employmentLabels[getValue() as string] ?? ((getValue() as string) || "—")}
            </span>
        ),
    },
    {
        id: "monthly_income",
        accessorFn: (row) => (row.monthly_income != null ? String(row.monthly_income) : ""),
        header: "Monthly income",
        cell: ({ row }) => {
            const val = row.original.monthly_income;
            return (
                <span className="text-sm tabular-nums">
                    {val != null ? formatPhpCurrency(val as number) : "—"}
                </span>
            );
        },
        size: 140,
    },
    {
        id: "payslip",
        accessorFn: (row) => (row.payslip_url ? "yes" : ""),
        header: "Payslip",
        enableSorting: false,
        cell: ({ row }) => <DocPresent value={row.original.payslip_url} />,
        size: 80,
    },
    {
        id: "pagibig",
        accessorFn: (row) => (row.pagibig_url ? "yes" : ""),
        header: "Pag-IBIG doc",
        enableSorting: false,
        cell: ({ row }) => <DocPresent value={row.original.pagibig_url} />,
        size: 100,
    },
    {
        id: "valid_id",
        accessorFn: (row) => (row.has_valid_id ? "yes" : ""),
        header: "Valid ID",
        enableSorting: false,
        cell: ({ row }) => <DocPresent value={row.original.has_valid_id} />,
        size: 80,
    },
    {
        id: "status",
        accessorFn: (row) => str(row.status) ?? "",
        header: "Status",
        cell: ({ row }) => {
            const st = str(row.original.status) ?? "pending";
            const colorClass = statusColors[st] ?? statusColors.pending;
            return (
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
                    {st.replace("_", " ")}
                </span>
            );
        },
        size: 120,
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
                        to="/dashboard/agent/prequalification/$prequalificationId"
                        params={{ prequalificationId: pk }}
                    >
                        Review
                    </Link>
                </Button>
            ) : null;
        },
        size: 90,
    },
];

const AgentPrequalificationsPage = () => {
    const { data, isPending, isError } = useQuery({
        queryKey: ["agent", "prequalifications"],
        queryFn: () => agentPortalApi.prequalifications(),
        refetchInterval: 2_000,
    });

    const rows = useMemo<PrequalRow[]>(
        () => (data?.data as PrequalRow[] | undefined) ?? [],
        [data],
    );

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/agent" label="Dashboard" hideFrom="md" />
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Prequalifications</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Client-submitted documents and prequalification details.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs text-muted-foreground">
                    <FileTextIcon className="size-3.5" />
                    Read-only — clients submit their own documents
                </div>
            </div>

            <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                {isPending ? (
                    <DataTableSkeleton columnCount={8} />
                ) : isError ? (
                    <p className="text-destructive p-6">Could not load prequalifications.</p>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchPlaceholder="Search by client, employment status…"
                    />
                )}
            </Card>
        </div>
    );
};

export default AgentPrequalificationsPage;
