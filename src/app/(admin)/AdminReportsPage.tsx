import { adminResourceApi } from "@/db/api/admin.api";
import { asRecord, idStr, str } from "@/lib/record";
import { DashboardPanel } from "@/components/app/DashboardPanel";
import { StatTile } from "@/components/app/StatTile";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2Icon, DownloadIcon, UsersIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const csvCell = (v: string) => {
    const s = v.replace(/\r\n|\r|\n/g, " ");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
};

const toCsv = (headers: string[], rows: string[][]) =>
    [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\r\n");

const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

const AdminReportsPage = () => {
    const clientStatistics = useQuery({
        queryKey: ["admin", "client-statistics"],
        queryFn: () => adminResourceApi.clientStatistics(),
    });
    const properties = useQuery({
        queryKey: ["admin", "properties"],
        queryFn: () => adminResourceApi.properties(),
    });

    const totalClients = clientStatistics.data?.data.total_clients ?? 0;
    const propertyRows = (properties.data?.data as unknown[]) ?? [];

    const loading = clientStatistics.isPending || properties.isPending;
    const err = clientStatistics.isError || properties.isError;

    const statusCounts = useMemo(() => {
        const m = new Map<string, number>();
        for (const raw of propertyRows) {
            const p = asRecord(raw);
            const key = (str(p.status) || "unknown").toLowerCase() || "unknown";
            m.set(key, (m.get(key) ?? 0) + 1);
        }
        return [...m.entries()].sort((a, b) => b[1] - a[1]);
    }, [propertyRows]);

    const exportProperties = () => {
        const headers = [
            "id",
            "title",
            "address",
            "price",
            "status",
            "agent_id",
            "agent_first_name",
            "agent_last_name",
            "agent_email",
        ];
        const rows = propertyRows.map((raw) => {
            const p = asRecord(raw);
            const agent = asRecord(p.agent);
            return [
                idStr(p.id),
                str(p.title) ?? "",
                str(p.address) ?? "",
                p.price != null ? String(p.price) : "",
                str(p.status) ?? "",
                idStr(agent.id),
                str(agent.first_name) ?? "",
                str(agent.last_name) ?? "",
                str(agent.email) ?? "",
            ];
        });
        const stamp = new Date().toISOString().slice(0, 10);
        downloadCsv(`fiesta-properties-${stamp}.csv`, toCsv(headers, rows));
        toast.success("Property export downloaded.");
    };

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/admin" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Reports &amp; exports</h1>
                <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                    Review aggregate Client totals and property summaries, or download the
                    authorized property report.
                </p>
            </div>

            {loading ? (
                <>
                    {/* stat tiles */}
                    <section className="grid gap-5 sm:grid-cols-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div
                                key={i}
                                className="border-border/80 flex items-center gap-3.5 rounded-xl border p-5 shadow-sm"
                            >
                                <Skeleton className="size-[52px] shrink-0 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-7 w-10" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))}
                    </section>
                    {/* panels row */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="border-border/80 rounded-xl border shadow-sm">
                                <div className="px-6 pb-3 pt-5">
                                    <Skeleton className="h-6 w-28" />
                                </div>
                                <div className="px-6 pb-6 space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <div className="flex gap-3 pt-1">
                                        <Skeleton className="h-9 w-36 rounded-md" />
                                        <Skeleton className="h-9 w-36 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* status table panel */}
                    <div className="border-border/80 rounded-xl border shadow-sm">
                        <div className="px-6 pb-3 pt-5">
                            <Skeleton className="h-6 w-44" />
                        </div>
                        <div className="px-6 pb-6 space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : err ? (
                <p className="text-destructive">Could not load report data.</p>
            ) : (
                <>
                    <section className="grid gap-5 sm:grid-cols-2">
                        <StatTile icon={UsersIcon} value={totalClients} label="Clients" />
                        <StatTile icon={Building2Icon} value={propertyRows.length} label="Properties" />
                    </section>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <DashboardPanel title="CSV exports">
                            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                                Download the property records available to the Admin portal in
                                UTF-8 CSV format for Excel.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    className="gap-2"
                                    onClick={exportProperties}
                                    disabled={propertyRows.length === 0}
                                >
                                    <DownloadIcon className="size-4" />
                                    Export properties
                                </Button>
                            </div>
                        </DashboardPanel>

                        <DashboardPanel title="Open lists">
                            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                                Drill into property rows, filters, and edits from the main Admin
                                table.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" asChild>
                                    <Link to="/admin/properties">Properties</Link>
                                </Button>
                            </div>
                        </DashboardPanel>
                    </div>

                    <DashboardPanel
                        title="Properties by listing status"
                        flush
                        className="w-full max-w-xl"
                    >
                        {statusCounts.length === 0 ? (
                            <p className="text-muted-foreground px-6 pb-6 text-sm">No properties to summarize.</p>
                        ) : (
                            <div className="px-4 pb-4 sm:px-6">
                                <Table className="table-fixed">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="px-3">Status</TableHead>
                                            <TableHead className="w-24 px-3 text-right tabular-nums">
                                                Count
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {statusCounts.map(([status, count]) => (
                                            <TableRow key={status}>
                                                <TableCell className="px-3 py-3 font-medium capitalize">
                                                    {status}
                                                </TableCell>
                                                <TableCell className="w-24 px-3 py-3 text-right tabular-nums">
                                                    {count}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </DashboardPanel>
                </>
            )}
        </div>
    );
};

export default AdminReportsPage;
