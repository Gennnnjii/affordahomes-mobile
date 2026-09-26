import { adminResourceApi } from "@/db/api/admin.api";
import { asRecord, str } from "@/lib/record";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
    CalendarIcon,
    ClockIcon,
    FilterIcon,
    UserRoundIcon,
    UsersIcon,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt12(dt: string | null | undefined): string {
    if (!dt) return "—";
    return new Date(dt).toLocaleTimeString("en-PH", {
        timeZone: "Asia/Manila",
        hour:   "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function fmtDate(d: string | null | undefined): string {
    if (!d) return "—";
    // Slice to YYYY-MM-DD so a full ISO timestamp like "2026-04-15T00:00:00.000000Z"
    // doesn't produce "...ZT00:00:00" which is invalid.
    const dateOnly = String(d).slice(0, 10);
    const dt = new Date(dateOnly + "T00:00:00");
    if (isNaN(dt.getTime())) return dateOnly;
    return dt.toLocaleDateString("en-PH", {
        weekday: "short",
        month:   "short",
        day:     "numeric",
        year:    "numeric",
    });
}

function fmtDuration(mins: number | null | undefined): string {
    if (!mins) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const MANILA_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

function formatDateOnly(date: Date): string {
    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
    ].join("-");
}

function parseDateOnly(value: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) throw new RangeError(`Invalid calendar date: ${value}`);

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year
        || date.getUTCMonth() !== month - 1
        || date.getUTCDate() !== day
    ) {
        throw new RangeError(`Invalid calendar date: ${value}`);
    }

    return date;
}

function todayStr(now: Date = new Date()): string {
    const parts = MANILA_DATE_FORMATTER.formatToParts(now);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
        throw new RangeError("Could not resolve the current Philippine date.");
    }

    return `${year}-${month}-${day}`;
}

function addDays(base: string, n: number): string {
    const date = parseDateOnly(base);
    date.setUTCDate(date.getUTCDate() + n);
    return formatDateOnly(date);
}

function startOfWeek(date: string): string {
    return addDays(date, -parseDateOnly(date).getUTCDay());
}

function startOfMonth(date: string): string {
    const first = parseDateOnly(date);
    first.setUTCDate(1);
    return formatDateOnly(first);
}

// ─── Shared row component ─────────────────────────────────────────────────────

interface TimesheetRowProps {
    record: Record<string, unknown>;
    showDate?: boolean;
}

const TimesheetRow = ({ record, showDate }: TimesheetRowProps) => {
    const agent    = asRecord(record.agent as Record<string, unknown>);
    const fullName = `${str(agent.first_name) ?? ""} ${str(agent.last_name) ?? ""}`.trim() || "—";
    const initials = fullName.split(" ").map((w) => w[0]).slice(0, 2).join("");
    const empId    = str(agent.employee_id) ?? "—";
    const timeIn   = str(record.time_in  as string | null);
    const timeOut  = str(record.time_out as string | null);
    const duration = record.duration_minutes as number | null;
    const status   = timeOut ? "completed" : timeIn ? "active" : "absent";

    return (
        <tr className="border-border/60 border-b last:border-0 hover:bg-muted/30 transition-colors">
            {showDate && (
                <td className="px-5 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {fmtDate(str(record.date as string | null))}
                </td>
            )}
            <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 text-indigo-700 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {initials}
                    </div>
                    <div>
                        <p className="font-medium text-sm">{fullName}</p>
                        <p className="text-muted-foreground font-mono text-xs">{empId}</p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-3 text-sm">
                {timeIn
                    ? <span className="text-emerald-700 font-medium">{fmt12(timeIn)}</span>
                    : <span className="text-muted-foreground">—</span>}
            </td>
            <td className="px-5 py-3 text-sm">
                {timeOut
                    ? <span className="text-red-700 font-medium">{fmt12(timeOut)}</span>
                    : <span className="text-muted-foreground">—</span>}
            </td>
            <td className="px-5 py-3 text-sm text-muted-foreground">
                {fmtDuration(duration)}
            </td>
            <td className="px-5 py-3">
                {status === "completed" && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Completed
                    </span>
                )}
                {status === "active" && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        Active
                    </span>
                )}
            </td>
        </tr>
    );
};

// ─── Daily tab ────────────────────────────────────────────────────────────────

const DailyTab = () => {
    const [date, setDate]     = useState(todayStr());

    const { data, isPending, isError } = useQuery({
        queryKey: ["admin", "timesheets", date],
        queryFn:  () => adminResourceApi.timesheets(date),
    });

    const records       = (data?.data ?? []) as Record<string, unknown>[];
    const completedCount = records.filter((r) => r.time_out).length;
    const activeCount    = records.filter((r) => r.time_in && !r.time_out).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="text-muted-foreground size-4" />
                    <h2 className="font-semibold">
                        {date === todayStr() ? "Today's attendance" : `Attendance — ${fmtDate(date)}`}
                    </h2>
                    {records.length > 0 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {records.length} {records.length === 1 ? "record" : "records"}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={date}
                        max={todayStr()}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40 text-sm"
                    />
                    {date !== todayStr() && (
                        <Button variant="ghost" size="sm" onClick={() => setDate(todayStr())}>
                            Today
                        </Button>
                    )}
                </div>
            </div>

            {records.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                        <span className="size-2 rounded-full bg-blue-500 inline-block" />
                        {activeCount} active
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                        <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                        {completedCount} completed
                    </div>
                </div>
            )}

            <TimesheetTable records={records} isPending={isPending} isError={isError} />
        </div>
    );
};

// ─── Shared table component ───────────────────────────────────────────────────

interface TimesheetTableProps {
    records: Record<string, unknown>[];
    isPending: boolean;
    isError: boolean;
    showDate?: boolean;
}

const TimesheetTable = ({ records, isPending, isError, showDate }: TimesheetTableProps) => (
    <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
        {isPending ? (
            <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
        ) : isError ? (
            <p className="text-destructive p-6">Could not load records.</p>
        ) : records.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="bg-muted flex size-12 items-center justify-center rounded-xl">
                    <UserRoundIcon className="text-muted-foreground size-6" strokeWidth={1.5} />
                </div>
                <p className="font-medium">No records found</p>
                <p className="text-muted-foreground text-sm">
                    Adjust the filters or date range to see results.
                </p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-border/60 border-b bg-muted/40">
                            {showDate && (
                                <th className="px-5 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Date</th>
                            )}
                            <th className="px-5 py-3 text-left font-medium text-muted-foreground">Employee</th>
                            <th className="px-5 py-3 text-left font-medium text-muted-foreground">Time In</th>
                            <th className="px-5 py-3 text-left font-medium text-muted-foreground">Time Out</th>
                            <th className="px-5 py-3 text-left font-medium text-muted-foreground">Duration</th>
                            <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((r) => (
                            <TimesheetRow key={str(r.id)} record={r} showDate={showDate} />
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </Card>
);

// ─── Summary cards ────────────────────────────────────────────────────────────

interface SummaryProps {
    totalRecords: number;
    totalMinutes: number;
    agentCount:   number;
}

const SummaryCards = ({ totalRecords, totalMinutes, agentCount }: SummaryProps) => {
    const totalHours   = (totalMinutes / 60).toFixed(1);
    const avgPerPerson = agentCount > 0 ? (totalMinutes / agentCount / 60).toFixed(1) : "0.0";

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
                { label: "Total records",     value: totalRecords,  icon: CalendarIcon,  color: "text-blue-600   bg-blue-50" },
                { label: "Unique employees",  value: agentCount,    icon: UsersIcon,     color: "text-indigo-600 bg-indigo-50" },
                { label: "Total hours",       value: `${totalHours}h`,  icon: ClockIcon, color: "text-emerald-600 bg-emerald-50" },
                { label: "Avg hours/person",  value: `${avgPerPerson}h`, icon: UserRoundIcon, color: "text-amber-600 bg-amber-50" },
            ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="border-border/80 shadow-sm">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${color.split(" ")[1]}`}>
                            <Icon className={`size-4 ${color.split(" ")[0]}`} />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">{label}</p>
                            <p className="text-lg font-bold leading-tight">{value}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// ─── Per-agent summary table ──────────────────────────────────────────────────

interface AgentSummaryTableProps {
    summary: Record<string, unknown>[];
}

const AgentSummaryTable = ({ summary }: AgentSummaryTableProps) => {
    if (summary.length === 0) return null;

    return (
        <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Per-employee summary
                </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-border/60 border-b bg-muted/40">
                            <th className="px-5 py-2.5 text-left font-medium text-muted-foreground">Employee</th>
                            <th className="px-5 py-2.5 text-left font-medium text-muted-foreground">Days worked</th>
                            <th className="px-5 py-2.5 text-left font-medium text-muted-foreground">Total hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary.map((s, i) => {
                            const agent    = asRecord(s.agent as Record<string, unknown>);
                            const fullName = `${str(agent.first_name) ?? ""} ${str(agent.last_name) ?? ""}`.trim() || "—";
                            const initials = fullName.split(" ").map((w) => w[0]).slice(0, 2).join("");
                            const empId    = str(agent.employee_id) ?? "—";
                            return (
                                <tr key={i} className="border-border/60 border-b last:border-0 hover:bg-muted/30">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-100 text-indigo-700 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="font-medium">{fullName}</p>
                                                <p className="text-muted-foreground font-mono text-xs">{empId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 font-medium">
                                        {String(s.days_worked ?? 0)} days
                                    </td>
                                    <td className="px-5 py-3 font-medium">
                                        {Number(s.total_hours ?? 0).toFixed(1)} hrs
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// ─── Preset helpers ───────────────────────────────────────────────────────────

type Preset = { label: string; from: string; to: string };

function buildPresets(): Preset[] {
    const t = todayStr();
    const weekStart     = startOfWeek(t);
    const lastWeekStart = startOfWeek(addDays(weekStart, -1));
    const lastWeekEnd   = addDays(weekStart, -1);
    const monthStart    = startOfMonth(t);
    const lastMonthDate = addDays(monthStart, -1);
    const lastMonthStart = startOfMonth(lastMonthDate);

    return [
        { label: "Today",       from: t,              to: t },
        { label: "This week",   from: weekStart,      to: t },
        { label: "Last week",   from: lastWeekStart,  to: lastWeekEnd },
        { label: "This month",  from: monthStart,     to: t },
        { label: "Last month",  from: lastMonthStart, to: lastMonthDate },
    ];
}

// ─── Records (report) tab ─────────────────────────────────────────────────────

const RecordsTab = () => {
    const presets     = useMemo(buildPresets, []);
    const [from, setFrom] = useState(presets[1].from); // default: this week
    const [to,   setTo  ] = useState(presets[1].to);
    const [activePreset, setActivePreset] = useState<string>("This week");
    const [agentId, setAgentId] = useState<string>("");

    const { data: agentsData } = useQuery({
        queryKey: ["admin", "agents"],
        queryFn:  () => adminResourceApi.agents(),
    });
    const agents = (agentsData?.data ?? []) as Record<string, unknown>[];

    const { data, isPending, isError } = useQuery({
        queryKey: ["admin", "timesheets", "report", from, to, agentId],
        queryFn:  () => adminResourceApi.timesheetReport({ from, to, agent_id: agentId || undefined }),
        enabled:  !!from && !!to,
    });

    const rd      = data?.data;
    const records = (rd?.records ?? []) as Record<string, unknown>[];
    const summary = (rd?.summary ?? []) as Record<string, unknown>[];
    const agentCount = summary.length;

    const applyPreset = (p: Preset) => {
        setFrom(p.from);
        setTo(p.to);
        setActivePreset(p.label);
    };

    const handleManualDate = (field: "from" | "to", val: string) => {
        if (field === "from") setFrom(val);
        else setTo(val);
        setActivePreset("Custom");
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="border-border/80 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FilterIcon className="text-primary size-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Preset buttons */}
                    <div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                            Quick range
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {presets.map((p) => (
                                <Button
                                    key={p.label}
                                    size="sm"
                                    variant={activePreset === p.label ? "default" : "outline"}
                                    onClick={() => applyPreset(p)}
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Custom date range + employee filter */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">From</label>
                            <Input
                                type="date"
                                value={from}
                                max={to}
                                onChange={(e) => handleManualDate("from", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">To</label>
                            <Input
                                type="date"
                                value={to}
                                min={from}
                                max={todayStr()}
                                onChange={(e) => handleManualDate("to", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Employee</label>
                            <select
                                value={agentId}
                                onChange={(e) => setAgentId(e.target.value)}
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">All employees</option>
                                {agents.map((a) => {
                                    const id   = str(a.id) ?? "";
                                    const name = `${str(a.first_name) ?? ""} ${str(a.last_name) ?? ""}`.trim();
                                    const emp  = str(a.employee_id) ?? "";
                                    return (
                                        <option key={id} value={id}>
                                            {name} ({emp})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary cards */}
            {!isPending && !isError && records.length > 0 && (
                <SummaryCards
                    totalRecords={rd?.total_records ?? 0}
                    totalMinutes={rd?.total_minutes ?? 0}
                    agentCount={agentCount}
                />
            )}

            {/* Per-employee summary (only when showing all employees) */}
            {!agentId && !isPending && summary.length > 1 && (
                <AgentSummaryTable summary={summary} />
            )}

            {/* Full records table */}
            <div>
                <div className="mb-3 flex items-center gap-2">
                    <h2 className="font-semibold">All records</h2>
                    {records.length > 0 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {records.length}
                        </span>
                    )}
                </div>
                <TimesheetTable
                    records={records}
                    isPending={isPending}
                    isError={isError}
                    showDate
                />
            </div>
        </div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const AdminTimesheetPage = () => (
    <div className="space-y-6">
        <ScreenBackLink to="/admin" label="Dashboard" hideFrom="md" />
        <div>
            <h1 className="text-2xl font-semibold tracking-tight">Timesheets</h1>
            <p className="text-muted-foreground mt-1 text-sm">
                Monitor employee attendance and review time records across any date range.
            </p>
        </div>

        <Tabs defaultValue="daily">
            <TabsList>
                <TabsTrigger value="daily">Daily attendance</TabsTrigger>
                <TabsTrigger value="records">Attendance records</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="mt-6">
                <DailyTab />
            </TabsContent>

            <TabsContent value="records" className="mt-6">
                <RecordsTab />
            </TabsContent>
        </Tabs>
    </div>
);

export default AdminTimesheetPage;
