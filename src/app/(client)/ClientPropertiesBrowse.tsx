import { clientPortalApi } from "@/db/api/client.portal.api";
import { asRecord, idStr, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { HomeIcon, MapPinIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { propertyStatusBadgeClass, propertyStatusLabel, normalizePropertyStatus } from "@/lib/property-status";
import { cn } from "@/lib/utils";

type BrowseRow = Record<string, unknown> & {
    rowKey: string;
    inquiryId: string;
    propertyId: string;
    title: string;
    address: string;
    price: number | null;
    status: string;
    agentLabel: string;
    imagePath: string | null;
};

const formatAgentFromInquiry = (row: Record<string, unknown>): string => {
    const invAgent = asRecord(row.agent);
    const fromInquiry =
        `${str(invAgent.first_name) ?? ""} ${str(invAgent.last_name) ?? ""}`.trim() ||
        str(invAgent.email) ||
        "";
    if (fromInquiry) return fromInquiry;
    const prop = asRecord(row.property);
    const listAgent = asRecord(prop.agent);
    return (
        `${str(listAgent.first_name) ?? ""} ${str(listAgent.last_name) ?? ""}`.trim() ||
        str(listAgent.email) ||
        ""
    );
};

const columns: ColumnDef<BrowseRow>[] = [
    {
        id: "property",
        accessorFn: (row) => `${str(row.title)} ${str(row.propertyId)}`,
        header: "Property",
        cell: ({ row }) => {
            const img = row.original.imagePath ? publicStorageUrl(row.original.imagePath) : null;
            const code = String(row.original.propertyId ?? "").slice(-6).toUpperCase();
            return (
                <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-md border border-border/60">
                        {img ? (
                            <img src={img} alt="" className="size-full object-cover" />
                        ) : (
                            <div className="flex size-full items-center justify-center">
                                <HomeIcon className="text-muted-foreground size-5" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-medium">{str(row.original.title) || "Property"}</p>
                        {code ? <p className="text-muted-foreground font-mono text-xs">{code}</p> : null}
                    </div>
                </div>
            );
        },
        size: 280,
    },
    {
        id: "address",
        accessorFn: (row) => str(row.address) ?? "",
        header: "Location",
        cell: ({ getValue }) => (
            <span
                className="text-muted-foreground flex min-w-0 items-start gap-1 text-sm"
                title={(getValue() as string) || undefined}
            >
                <MapPinIcon className="mt-0.5 size-3.5 shrink-0 opacity-70" />
                <span className="line-clamp-2 break-words">{(getValue() as string) || "—"}</span>
            </span>
        ),
        size: 200,
    },
    {
        id: "price",
        accessorFn: (row) => (row.price != null ? Number(row.price) : -1),
        header: "Price",
        cell: ({ row }) => (
            <span className="tabular-nums text-sm font-semibold">
                {row.original.price != null
                    ? `₱${Number(row.original.price).toLocaleString()}`
                    : "—"}
            </span>
        ),
        size: 120,
    },
    {
        id: "status",
        accessorFn: (row) => normalizePropertyStatus(str(row.status)),
        header: "Status",
        cell: ({ getValue }) => {
            const v = getValue() as string;
            return (
                <span
                    className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
                        propertyStatusBadgeClass(v),
                    )}
                >
                    {propertyStatusLabel(v)}
                </span>
            );
        },
        size: 120,
    },
    {
        id: "agent",
        accessorFn: (row) => str(row.agentLabel) ?? "",
        header: "Assigned agent",
        cell: ({ getValue }) => {
            const label = (getValue() as string).trim();
            return label ? (
                <span className="text-sm" title={label}>
                    {label}
                </span>
            ) : (
                <span className="text-muted-foreground text-xs italic">Unassigned</span>
            );
        },
        size: 168,
    },
    {
        id: "actions",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
            const pk = str(row.original.propertyId);
            return pk ? (
                <Button variant="outline" size="sm" asChild>
                    <Link to="/property/$propertyId" params={{ propertyId: pk }}>
                        View
                    </Link>
                </Button>
            ) : null;
        },
        size: 88,
    },
];

const ClientPropertiesBrowse = () => {
    const { data, isPending, isError } = useQuery({
        queryKey: ["client", "inquiries"],
        queryFn: () => clientPortalApi.inquiries(),
        refetchInterval: 2_000,
    });

    const rows = useMemo<BrowseRow[]>(() => {
        const raw = (data?.data as Record<string, unknown>[]) ?? [];
        const withProperty = raw.filter((r) => str(asRecord(r.property).id));
        const sorted = [...withProperty].sort((a, b) => {
            const ta = new Date(String(asRecord(a).created_at ?? "")).getTime();
            const tb = new Date(String(asRecord(b).created_at ?? "")).getTime();
            return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
        });
        const seen = new Set<string>();
        const out: BrowseRow[] = [];
        for (const r of sorted) {
            const prop = asRecord(r.property);
            const pid = str(prop.id);
            if (!pid || seen.has(pid)) continue;
            seen.add(pid);
            const priceRaw = prop.price;
            out.push({
                rowKey: pid,
                inquiryId: idStr(r.id) ?? "",
                propertyId: pid,
                title: str(prop.title) ?? "Property",
                address: str(prop.address) ?? "",
                price: priceRaw != null && priceRaw !== "" ? Number(priceRaw) : null,
                status: normalizePropertyStatus(str(prop.status)),
                agentLabel: formatAgentFromInquiry(r),
                imagePath: str(prop.main_image) || null,
            });
        }
        return out;
    }, [data]);

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">My properties</h1>
                <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                    Properties you have reserved or are actively inquiring about, with your assigned agent when
                    available.
                </p>
            </div>

            <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                {isPending ? (
                    <DataTableSkeleton columnCount={6} />
                ) : isError ? (
                    <p className="text-destructive p-6">Could not load your properties.</p>
                ) : rows.length === 0 ? (
                    <div className="text-muted-foreground space-y-3 p-8 text-center text-sm">
                        <p>You do not have any property inquiries yet.</p>
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/properties">Browse listings</Link>
                        </Button>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchPlaceholder="Search by title, location, agent, status…"
                    />
                )}
            </Card>
        </div>
    );
};

export default ClientPropertiesBrowse;
