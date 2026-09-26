import { agentPortalApi } from "@/db/api/agent.portal.api";
import { asRecord, str } from "@/lib/record";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

type RelationshipKind = "appointment" | "reservation";
type ClientRow = {
    id: string;
    name: string;
    email: string;
    source: string;
    appointmentCount: number;
    reservationCount: number;
};
type ReferredClientRow = {
    name: string;
    referredAt: string;
};

const formatReferredAt = (value: string | null): string => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const linkedViaSummary = (reservationCount: number, appointmentCount: number): string => {
    const relationships: string[] = [];
    if (reservationCount > 0) {
        relationships.push(`Reservation${reservationCount === 1 ? "" : "s"} (${reservationCount})`);
    }
    if (appointmentCount > 0) {
        relationships.push(`Appointment${appointmentCount === 1 ? "" : "s"} (${appointmentCount})`);
    }
    return relationships.join(", ");
};

const activeClientColumns: ColumnDef<ClientRow>[] = [
    {
        id: "name",
        accessorFn: (row) => row.name,
        header: "Client",
        cell: ({ getValue }) => (
            <span className="font-medium">{(getValue() as string) || "—"}</span>
        ),
    },
    {
        id: "email",
        accessorFn: (row) => row.email,
        header: "Email",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground text-sm">{(getValue() as string) || "—"}</span>
        ),
    },
    {
        id: "source",
        accessorFn: (row) => row.source,
        header: "Linked via",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground text-sm">
                {(getValue() as string) || "—"}
            </span>
        ),
    },
];

const referredClientColumns: ColumnDef<ReferredClientRow>[] = [
    {
        id: "name",
        accessorFn: (row) => row.name,
        header: "Client",
        cell: ({ getValue }) => (
            <span className="font-medium">{getValue() as string}</span>
        ),
    },
    {
        id: "referredAt",
        accessorFn: (row) => row.referredAt,
        header: "Referred on",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground text-sm">{getValue() as string}</span>
        ),
    },
];

const AgentClientsPage = () => {
    const referredClients = useQuery({
        queryKey: ["agent", "referred-clients"],
        queryFn: () => agentPortalApi.referredClients(),
    });
    const appt = useQuery({
        queryKey: ["agent", "appointments"],
        queryFn: () => agentPortalApi.appointments(),
    });
    const reservations = useQuery({
        queryKey: ["agent", "reservations"],
        queryFn: () => agentPortalApi.reservations(),
    });

    const referredRows = useMemo<ReferredClientRow[]>(
        () =>
            (referredClients.data?.data ?? []).map((client) => ({
                name: `${client.first_name.trim()} ${client.last_name.trim()}`.trim() || "Client",
                referredAt: formatReferredAt(client.referred_at),
            })),
        [referredClients.data],
    );

    const rows = useMemo<ClientRow[]>(() => {
        const map = new Map<string, ClientRow>();
        const add = (raw: unknown, relationship: RelationshipKind) => {
            const row = asRecord(raw);
            const c = asRecord(row.client);
            const id = str(c.id);
            if (!id) return;
            const name = `${str(c.first_name) ?? ""} ${str(c.last_name) ?? ""}`.trim() || "Client";
            const email = str(c.email) ?? "";
            const prev = map.get(id);
            const appointmentCount =
                (prev?.appointmentCount ?? 0) + (relationship === "appointment" ? 1 : 0);
            const reservationCount =
                (prev?.reservationCount ?? 0) + (relationship === "reservation" ? 1 : 0);
            map.set(id, {
                id,
                name,
                email,
                source: linkedViaSummary(reservationCount, appointmentCount),
                appointmentCount,
                reservationCount,
            });
        };
        ((appt.data?.data as unknown[]) ?? []).forEach((r) => add(r, "appointment"));
        ((reservations.data?.data as unknown[]) ?? []).forEach((r) => add(r, "reservation"));
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [appt.data, reservations.data]);

    const loading = appt.isPending || reservations.isPending;
    const err = appt.isError || reservations.isError;

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/agent" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">My clients</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    View referred Clients and Clients linked through AFFORDAHOMES activity.
                </p>
            </div>

            <section className="space-y-3">
                <div>
                    <h2 className="text-lg font-semibold">Referred clients</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Clients who registered using your referral link, including those who have
                        not started a property inquiry yet.
                    </p>
                </div>
                <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                    {referredClients.isPending ? (
                        <DataTableSkeleton columnCount={2} />
                    ) : referredClients.isError ? (
                        <CardContent className="space-y-3 p-6 text-center">
                            <p className="text-destructive text-sm">
                                Could not load referred clients.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => referredClients.refetch()}
                            >
                                Try again
                            </Button>
                        </CardContent>
                    ) : referredRows.length === 0 ? (
                        <CardContent className="p-6 text-center">
                            <p className="font-medium">No referred clients yet</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Clients who register with your referral link will appear here.
                            </p>
                        </CardContent>
                    ) : (
                        <DataTable
                            columns={referredClientColumns}
                            data={referredRows}
                            searchPlaceholder="Search referred clients…"
                        />
                    )}
                </Card>
            </section>

            <section className="space-y-3">
                <div>
                    <h2 className="text-lg font-semibold">Active clients</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Clients linked to your appointments and reservations.
                    </p>
                </div>
                <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                    {loading ? (
                        <DataTableSkeleton columnCount={3} />
                    ) : err ? (
                        <p className="text-destructive p-6">Could not load active clients.</p>
                    ) : (
                        <DataTable
                            columns={activeClientColumns}
                            data={rows}
                            searchPlaceholder="Search by name, email, source…"
                        />
                    )}
                </Card>
            </section>
        </div>
    );
};

export default AgentClientsPage;
