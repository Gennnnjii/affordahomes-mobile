import { agentPortalApi } from "@/db/api/agent.portal.api";
import type { Reservation } from "@/types/reservation";
import { getApiErrorMessage } from "@/lib/api-error";
import { asRecord, idStr, str } from "@/lib/record";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, ClockIcon, FileTextIcon, HandshakeIcon, HistoryIcon, InboxIcon } from "lucide-react";

type DocsFilter = "all" | "complete" | "partial" | "none";
type Tab = "open" | "mine" | "reservations" | "history";
type InquiryRow = Record<string, unknown>;
type ActualReservationRow = {
    [Key in keyof Reservation]: Reservation[Key];
};

const inquiryStatusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    responded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    closed: "bg-muted text-muted-foreground",
};

const reservationStatusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    sold: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const fallbackStatusColor = "bg-muted text-muted-foreground";

const shortRef = (id: string) => (id.length >= 8 ? id.slice(-8).toUpperCase() : id.toUpperCase());

const formatReservedAt = (value?: string | null): string => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const personName = (value: unknown): string => {
    const person = asRecord(value);
    return (
        `${str(person.first_name) ?? ""} ${str(person.last_name) ?? ""}`.trim() ||
        str(person.email) ||
        ""
    );
};

function docsStatus(row: InquiryRow): "complete" | "partial" | "none" {
    const prequal = asRecord(row.client_prequalification);
    if (!prequal.submitted_at) return "none";
    const has = [prequal.payslip_url, prequal.pagibig_url, prequal.has_valid_id].filter(Boolean).length;
    if (has === 3) return "complete";
    return "partial";
}

const DocsCell = ({ row }: { row: InquiryRow }) => {
    const state = docsStatus(row);
    if (state === "complete") {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle2Icon className="size-3" /> Complete
            </span>
        );
    }
    if (state === "partial") {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <AlertCircleIcon className="size-3" /> Incomplete
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <ClockIcon className="size-3" /> Not submitted
        </span>
    );
};

const OpenClaimCell = ({ row, onClaim, claiming }: {
    row: InquiryRow;
    onClaim: (id: string) => void;
    claiming: boolean;
}) => {
    const pk = idStr(row.id);
    if (!pk) return null;
    return (
        <Button size="sm" disabled={claiming} onClick={() => onClaim(pk)}>
            {claiming ? "Claiming..." : "Claim"}
        </Button>
    );
};

const myInquiryColumns: ColumnDef<InquiryRow>[] = [
    {
        id: "subject",
        accessorFn: (row) => str(row.subject) ?? "",
        header: "Subject",
        cell: ({ getValue }) => <span className="font-medium">{(getValue() as string) || "—"}</span>,
    },
    {
        id: "client",
        accessorFn: (row) => personName(row.client),
        header: "Client",
        cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{(getValue() as string) || "—"}</span>,
    },
    {
        id: "docs",
        accessorFn: (row) => docsStatus(row),
        header: "Documents",
        cell: ({ row }) => <DocsCell row={row.original} />,
        size: 130,
    },
    {
        id: "status",
        accessorFn: (row) => str(row.status) ?? "",
        header: "Status",
        cell: ({ row }) => {
            const status = str(row.original.status) ?? "pending";
            const colorClass = inquiryStatusColors[status] ?? fallbackStatusColor;
            return (
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
                    {status}
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
                    <Link to="/dashboard/agent/reservation/$reservationId" params={{ reservationId: pk }}>
                        Review
                    </Link>
                </Button>
            ) : null;
        },
        size: 90,
    },
];

const reservationColumns: ColumnDef<ActualReservationRow>[] = [
    {
        id: "reference",
        accessorFn: (row) => row.id,
        header: "Reservation",
        cell: ({ row }) => (
            <span className="font-mono text-xs font-semibold">{shortRef(row.original.id)}</span>
        ),
        size: 130,
    },
    {
        id: "client",
        accessorFn: (row) => personName(row.client),
        header: "Client",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground text-sm">
                {(getValue() as string) || "Client details unavailable"}
            </span>
        ),
    },
    {
        id: "property",
        accessorFn: (row) => {
            const property = asRecord(row.property);
            return `${str(property.title) ?? ""} ${str(property.address) ?? ""}`.trim();
        },
        header: "Property",
        cell: ({ row }) => {
            const property = asRecord(row.original.property);
            const title = str(property.title);
            const address = str(property.address);
            return (
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{title || "Property details unavailable"}</p>
                    {address ? (
                        <p className="text-muted-foreground line-clamp-2 text-xs">{address}</p>
                    ) : null}
                </div>
            );
        },
    },
    {
        id: "reservedAt",
        accessorFn: (row) => row.reserved_at ?? "",
        header: "Reserved",
        cell: ({ row }) => (
            <span className="text-muted-foreground text-sm">{formatReservedAt(row.original.reserved_at)}</span>
        ),
        size: 170,
    },
    {
        id: "status",
        accessorFn: (row) => row.status,
        header: "Status",
        cell: ({ row }) => {
            const status = str(row.original.status) ?? "unknown";
            const colorClass = reservationStatusColors[status] ?? fallbackStatusColor;
            return (
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
                    {status === "unknown" ? "Unavailable" : status}
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
        cell: ({ row }) => (
            <Button variant="outline" size="sm" asChild>
                <Link
                    to="/dashboard/agent/reservations/$reservationId"
                    params={{ reservationId: row.original.id }}
                >
                    Open
                </Link>
            </Button>
        ),
        size: 90,
    },
];

const docsFilterLabels: Record<DocsFilter, string> = {
    all: "All",
    complete: "Docs complete",
    partial: "Incomplete docs",
    none: "Not submitted",
};

const AgentReservationsPage = () => {
    const [tab, setTab] = useState<Tab>("open");
    const [docsFilter, setDocsFilter] = useState<DocsFilter>("all");
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const openQuery = useQuery({
        queryKey: ["agent", "inquiries", "open"],
        queryFn: () => agentPortalApi.openInquiries(),
        refetchInterval: 2_000,
    });

    const myInquiriesQuery = useQuery({
        queryKey: ["agent", "inquiries"],
        queryFn: () => agentPortalApi.inquiries(),
        refetchInterval: 2_000,
    });

    const reservationsQuery = useQuery({
        queryKey: ["agent", "reservations"],
        queryFn: () => agentPortalApi.reservations(),
        refetchInterval: 2_000,
    });

    const claimMutation = useMutation({
        mutationFn: (id: string) => agentPortalApi.claimInquiry(id),
        onMutate: (id) => setClaimingId(id),
        onSuccess: () => {
            toast.success("Inquiry claimed! It has been added to My inquiries.");
            void queryClient.invalidateQueries({ queryKey: ["agent", "inquiries", "open"] });
            void queryClient.invalidateQueries({ queryKey: ["agent", "inquiries"] });
            setTab("mine");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
        onSettled: () => setClaimingId(null),
    });

    const openRows = useMemo<InquiryRow[]>(
        () => (openQuery.data?.data as InquiryRow[] | undefined) ?? [],
        [openQuery.data],
    );

    const allMine = useMemo<InquiryRow[]>(
        () => (myInquiriesQuery.data?.data as InquiryRow[] | undefined) ?? [],
        [myInquiriesQuery.data],
    );

    const activeMine = useMemo<InquiryRow[]>(
        () => allMine.filter((row) => {
            const status = str(row.status);
            return status === "pending" || status === "responded";
        }),
        [allMine],
    );

    const closedInquiryRows = useMemo<InquiryRow[]>(
        () => allMine.filter((row) => str(row.status) === "closed"),
        [allMine],
    );

    const mineRows = useMemo<InquiryRow[]>(
        () => (docsFilter === "all" ? activeMine : activeMine.filter((row) => docsStatus(row) === docsFilter)),
        [activeMine, docsFilter],
    );

    const allReservations = useMemo<ActualReservationRow[]>(
        () => reservationsQuery.data?.data ?? [],
        [reservationsQuery.data],
    );

    const reservationRows = useMemo<ActualReservationRow[]>(
        () => allReservations.filter((reservation) => reservation.status !== "sold"),
        [allReservations],
    );

    const soldReservationRows = useMemo<ActualReservationRow[]>(
        () => allReservations.filter((reservation) => reservation.status === "sold"),
        [allReservations],
    );

    const counts = useMemo(() => {
        const countByStatus = { complete: 0, partial: 0, none: 0 };
        for (const row of activeMine) countByStatus[docsStatus(row)]++;
        return countByStatus;
    }, [activeMine]);

    const historyCount = closedInquiryRows.length + soldReservationRows.length;

    const openColumns: ColumnDef<InquiryRow>[] = useMemo(
        () => [
            {
                id: "subject",
                accessorFn: (row) => str(row.subject) ?? "",
                header: "Subject",
                cell: ({ getValue }) => <span className="font-medium">{(getValue() as string) || "—"}</span>,
            },
            {
                id: "client",
                accessorFn: (row) => personName(row.client),
                header: "Client",
                cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{(getValue() as string) || "—"}</span>,
            },
            {
                id: "property",
                accessorFn: (row) => str(asRecord(row.property).title) ?? "",
                header: "Property",
                cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{(getValue() as string) || "—"}</span>,
            },
            {
                id: "docs",
                accessorFn: (row) => docsStatus(row),
                header: "Documents",
                cell: ({ row }) => <DocsCell row={row.original} />,
                size: 130,
            },
            {
                id: "actions",
                header: "",
                enableSorting: false,
                enableGlobalFilter: false,
                cell: ({ row }) => (
                    <OpenClaimCell
                        row={row.original}
                        onClaim={(id) => claimMutation.mutate(id)}
                        claiming={claimingId === idStr(row.original.id)}
                    />
                ),
                size: 100,
            },
        ],
        [claimingId, claimMutation],
    );

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/agent" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Claim inquiries, manage active work, and review completed history.
                </p>
            </div>

            <div className="flex w-fit flex-wrap gap-1 rounded-lg border p-1">
                <button
                    onClick={() => setTab("open")}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === "open"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <InboxIcon className="size-4" />
                    Open inquiries
                    {openRows.length > 0 ? (
                        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === "open" ? "bg-white/25" : "bg-muted"
                            }`}>
                            {openRows.length}
                        </span>
                    ) : null}
                </button>
                <button
                    onClick={() => setTab("mine")}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === "mine"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <HandshakeIcon className="size-4" />
                    My inquiries
                    {activeMine.length > 0 ? (
                        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === "mine" ? "bg-white/25" : "bg-muted"
                            }`}>
                            {activeMine.length}
                        </span>
                    ) : null}
                </button>
                <button
                    onClick={() => setTab("reservations")}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === "reservations"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <FileTextIcon className="size-4" />
                    Reservations
                    {reservationRows.length > 0 ? (
                        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === "reservations" ? "bg-white/25" : "bg-muted"
                            }`}>
                            {reservationRows.length}
                        </span>
                    ) : null}
                </button>
                <button
                    onClick={() => setTab("history")}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === "history"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <HistoryIcon className="size-4" />
                    History
                    {historyCount > 0 ? (
                        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === "history" ? "bg-white/25" : "bg-muted"
                            }`}>
                            {historyCount}
                        </span>
                    ) : null}
                </button>
            </div>

            {tab === "open" ? (
                <>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-300">
                        <strong>First come, first served.</strong> Click <strong>Claim</strong> to take ownership of an inquiry. Once claimed, it moves to <em>My inquiries</em> and is no longer visible to other agents.
                    </div>
                    <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                        {openQuery.isPending ? (
                            <DataTableSkeleton columnCount={5} />
                        ) : openQuery.isError ? (
                            <p className="text-destructive p-6">Could not load open inquiries.</p>
                        ) : openRows.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-16 text-center">
                                <InboxIcon className="text-muted-foreground/40 size-10" />
                                <p className="text-muted-foreground text-sm">No open inquiries at the moment.</p>
                            </div>
                        ) : (
                            <DataTable
                                columns={openColumns}
                                data={openRows}
                                searchPlaceholder="Search by subject, client, property..."
                            />
                        )}
                    </Card>
                </>
            ) : null}

            {tab === "mine" ? (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        {(["all", "complete", "partial", "none"] as DocsFilter[]).map((filter) => {
                            const active = docsFilter === filter;
                            const count = filter === "all" ? activeMine.length : counts[filter];
                            return (
                                <button
                                    key={filter}
                                    onClick={() => setDocsFilter(filter)}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                                        }`}
                                >
                                    {filter === "complete" ? <CheckCircle2Icon className="size-3" /> : null}
                                    {filter === "partial" ? <AlertCircleIcon className="size-3" /> : null}
                                    {filter === "none" ? <ClockIcon className="size-3" /> : null}
                                    {docsFilterLabels[filter]}
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/20" : "bg-muted"
                                        }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                        {myInquiriesQuery.isPending ? (
                            <DataTableSkeleton columnCount={5} />
                        ) : myInquiriesQuery.isError ? (
                            <p className="text-destructive p-6">Could not load inquiries.</p>
                        ) : (
                            <DataTable
                                columns={myInquiryColumns}
                                data={mineRows}
                                searchPlaceholder="Search by subject, client, status..."
                            />
                        )}
                    </Card>
                </>
            ) : null}

            {tab === "reservations" ? (
                <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                    {reservationsQuery.isPending ? (
                        <DataTableSkeleton columnCount={6} />
                    ) : reservationsQuery.isError ? (
                        <p className="text-destructive p-6">Could not load reservations.</p>
                    ) : reservationRows.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-center">
                            <FileTextIcon className="text-muted-foreground/40 size-10" />
                            <p className="text-muted-foreground text-sm">No reservations have been created yet.</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={reservationColumns}
                            data={reservationRows}
                            searchPlaceholder="Search by reference, client, property, status..."
                        />
                    )}
                </Card>
            ) : null}

            {tab === "history" ? (
                <div className="space-y-6">
                    <section className="space-y-3">
                        <div>
                            <h2 className="text-lg font-semibold">Inquiry History</h2>
                            <p className="text-muted-foreground text-sm">
                                Closed inquiries assigned to you.
                            </p>
                        </div>
                        <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                            {myInquiriesQuery.isPending ? (
                                <DataTableSkeleton columnCount={5} />
                            ) : myInquiriesQuery.isError ? (
                                <p className="text-destructive p-6">Could not load inquiry history.</p>
                            ) : closedInquiryRows.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-center">
                                    <HistoryIcon className="text-muted-foreground/40 size-9" />
                                    <p className="text-muted-foreground text-sm">No closed inquiries yet.</p>
                                </div>
                            ) : (
                                <DataTable
                                    columns={myInquiryColumns}
                                    data={closedInquiryRows}
                                    searchPlaceholder="Search closed inquiries..."
                                />
                            )}
                        </Card>
                    </section>

                    <section className="space-y-3">
                        <div>
                            <h2 className="text-lg font-semibold">Reservation History</h2>
                            <p className="text-muted-foreground text-sm">
                                Sold reservations assigned to you.
                            </p>
                        </div>
                        <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                            {reservationsQuery.isPending ? (
                                <DataTableSkeleton columnCount={6} />
                            ) : reservationsQuery.isError ? (
                                <p className="text-destructive p-6">Could not load reservation history.</p>
                            ) : soldReservationRows.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-center">
                                    <HistoryIcon className="text-muted-foreground/40 size-9" />
                                    <p className="text-muted-foreground text-sm">No sold reservations yet.</p>
                                </div>
                            ) : (
                                <DataTable
                                    columns={reservationColumns}
                                    data={soldReservationRows}
                                    searchPlaceholder="Search sold reservations..."
                                />
                            )}
                        </Card>
                    </section>
                </div>
            ) : null}
        </div>
    );
};

export default AgentReservationsPage;
