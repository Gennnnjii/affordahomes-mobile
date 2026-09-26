import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type FilterFn,
    type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ArrowUpDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 20, 50] as const;

const fuzzyFilter: FilterFn<Record<string, unknown>> = (row, columnId, value: string) => {
    const cellValue = row.getValue(columnId);
    const s = cellValue == null ? "" : String(cellValue).toLowerCase();
    return s.includes(value.toLowerCase());
};

fuzzyFilter.autoRemove = (val: unknown) => !val;

interface DataTableProps<TData extends Record<string, unknown>> {
    columns: ColumnDef<TData>[];
    data: TData[];
    searchPlaceholder?: string;
}

export function DataTable<TData extends Record<string, unknown>>({
    columns,
    data,
    searchPlaceholder = "Search…",
}: DataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter as FilterFn<TData>,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
        defaultColumn: {
            size: 140,
            minSize: 72,
            maxSize: 480,
        },
    });

    const totalCount = data.length;
    const filteredCount = table.getFilteredRowModel().rows.length;
    const pageCount = Math.max(1, table.getPageCount());
    const pageIndex = table.getState().pagination.pageIndex;

    return (
        <div className="flex flex-col">

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                <Input
                    placeholder={searchPlaceholder}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="h-8 max-w-xs text-sm"
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="hidden sm:inline">Rows per page</span>
                    <Select
                        value={String(table.getState().pagination.pageSize)}
                        onValueChange={(v) => {
                            table.setPageSize(Number(v));
                        }}
                    >
                        <SelectTrigger className="h-8 w-[68px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {PAGE_SIZES.map((s) => (
                                <SelectItem key={s} value={String(s)}>
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Table className="table-fixed">
                <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                        <TableRow key={hg.id} className="hover:bg-transparent">
                            {hg.headers.map((header) => {
                                const canSort = header.column.getCanSort();
                                const sorted = header.column.getIsSorted();
                                const w = header.getSize();
                                return (
                                    <TableHead
                                        key={header.id}
                                        className="border-border/40"
                                        style={{ width: w }}
                                    >
                                        {header.isPlaceholder ? null : canSort ? (
                                            <button
                                                type="button"
                                                className={cn(
                                                    "inline-flex select-none items-center gap-1 transition-colors hover:text-foreground",
                                                    sorted ? "text-foreground font-medium" : "",
                                                )}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                                {sorted === "asc" ? (
                                                    <ArrowUpIcon className="size-3.5" />
                                                ) : sorted === "desc" ? (
                                                    <ArrowDownIcon className="size-3.5" />
                                                ) : (
                                                    <ArrowUpDownIcon className="size-3.5 opacity-40" />
                                                )}
                                            </button>
                                        ) : (
                                            flexRender(header.column.columnDef.header, header.getContext())
                                        )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="text-muted-foreground h-32 text-center text-sm"
                            >
                                {totalCount === 0
                                    ? "No records yet."
                                    : `No results for "${globalFilter}".`}
                            </TableCell>
                        </TableRow>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className="max-w-0 border-border/40 whitespace-normal"
                                        style={{ width: cell.column.getSize() }}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
                <p className="text-muted-foreground text-sm tabular-nums">
                    {globalFilter
                        ? `${filteredCount} of ${totalCount} row${totalCount !== 1 ? "s" : ""}`
                        : `${totalCount} row${totalCount !== 1 ? "s" : ""}`}
                </p>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        aria-label="First page"
                    >
                        <ChevronsLeftIcon className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        aria-label="Previous page"
                    >
                        <ChevronLeftIcon className="size-4" />
                    </Button>
                    <span className="text-muted-foreground px-2 text-sm tabular-nums">
                        {pageIndex + 1} / {pageCount}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        aria-label="Next page"
                    >
                        <ChevronRightIcon className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.setPageIndex(pageCount - 1)}
                        disabled={!table.getCanNextPage()}
                        aria-label="Last page"
                    >
                        <ChevronsRightIcon className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
