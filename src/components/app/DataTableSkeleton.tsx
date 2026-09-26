import { Skeleton } from "@/components/ui/skeleton";

const COL_WIDTHS = [96, 144, 176, 120, 96, 160, 112, 136];

const ROW_WIDTHS = [
    [80, 160, 200, 100],
    [96, 140, 180, 88],
    [80, 176, 160, 104],
    [88, 120, 200, 96],
    [72, 160, 172, 112],
    [96, 136, 192, 88],
    [80, 152, 164, 100],
    [88, 168, 188, 96],
];

interface DataTableSkeletonProps {

    columnCount?: number;

    rowCount?: number;
}

export const DataTableSkeleton = ({
    columnCount = 5,
    rowCount = 8,
}: DataTableSkeletonProps) => {
    return (
        <div className="flex flex-col">

            <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <Skeleton className="h-8 w-64 max-w-xs" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24 hidden sm:block" />
                    <Skeleton className="h-8 w-[68px]" />
                </div>
            </div>

            <div className="border-border/60 flex items-center gap-3 border-b px-2 py-2.5">
                {Array.from({ length: columnCount }).map((_, ci) => (
                    <Skeleton
                        key={ci}
                        className="h-3.5"
                        style={{
                            width:
                                ci === columnCount - 1
                                    ? 48
                                    : COL_WIDTHS[ci % COL_WIDTHS.length],
                            flexShrink: 0,
                            ...(ci > 1 && ci < columnCount - 1
                                ? { flex: 1, maxWidth: COL_WIDTHS[ci % COL_WIDTHS.length] }
                                : {}),
                        }}
                    />
                ))}
            </div>

            {Array.from({ length: rowCount }).map((_, ri) => {
                const widths = ROW_WIDTHS[ri % ROW_WIDTHS.length];
                return (
                    <div
                        key={ri}
                        className="border-border/60 flex items-center gap-3 border-b px-2 py-3 last:border-0"
                    >
                        {Array.from({ length: columnCount }).map((_, ci) => {
                            const isAction = ci === columnCount - 1;
                            const w = widths[Math.min(ci, widths.length - 1)];
                            return isAction ? (
                                <Skeleton
                                    key={ci}
                                    className="ml-auto h-7 w-14 rounded-md"
                                />
                            ) : (
                                <Skeleton
                                    key={ci}
                                    className="h-4 shrink-0"
                                    style={{
                                        width: `${w}px`,
                                        ...(ci > 0 && ci < columnCount - 1
                                            ? { flex: 1, maxWidth: `${w + 40}px` }
                                            : {}),
                                    }}
                                />
                            );
                        })}
                    </div>
                );
            })}

            <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                <Skeleton className="h-4 w-20" />
                <div className="flex items-center gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="mx-1 h-4 w-12" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </div>
        </div>
    );
};
