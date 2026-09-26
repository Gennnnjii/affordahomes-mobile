import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminResourceApi } from "@/db/api/admin.api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { BackupMetadata } from "@/types/backup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
    DatabaseBackupIcon,
    RotateCcwIcon,
    ShieldAlertIcon,
    Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type BackupRow = {
    [Key in keyof BackupMetadata]: BackupMetadata[Key];
};

const BACKUPS_QUERY_KEY = ["admin", "backups"] as const;
const RESTORE_CONFIRMATION = "RESTORE DATABASE";

const formatFileSize = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes < 0) return "Size unavailable";
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const unitIndex = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );
    const value = bytes / 1024 ** unitIndex;
    const digits = unitIndex === 0 || value >= 10 ? 0 : 1;

    return `${value.toFixed(digits)} ${units[unitIndex]}`;
};

const formatCreatedAt = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const AdminBackupPage = () => {
    const queryClient = useQueryClient();
    const [selectedRestore, setSelectedRestore] = useState<BackupMetadata | null>(null);
    const [restoreConfirmation, setRestoreConfirmation] = useState("");
    const [selectedDelete, setSelectedDelete] = useState<BackupMetadata | null>(null);

    const backupsQuery = useQuery({
        queryKey: BACKUPS_QUERY_KEY,
        queryFn: () => adminResourceApi.backups(),
    });

    const createMutation = useMutation({
        mutationFn: () => adminResourceApi.createBackup(),
        onSuccess: (response) => {
            void queryClient.invalidateQueries({ queryKey: BACKUPS_QUERY_KEY });
            toast.success(response.message || "Database backup created.");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const restoreMutation = useMutation({
        mutationFn: (filename: string) => adminResourceApi.restoreBackup(filename),
        onSuccess: (response) => {
            void queryClient.invalidateQueries({ queryKey: BACKUPS_QUERY_KEY });
            setSelectedRestore(null);
            setRestoreConfirmation("");
            toast.success(response.message || "Database backup restored.");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const deleteMutation = useMutation({
        mutationFn: (filename: string) => adminResourceApi.deleteBackup(filename),
        onSuccess: (response) => {
            void queryClient.invalidateQueries({ queryKey: BACKUPS_QUERY_KEY });
            setSelectedDelete(null);
            toast.success(response.message || "Database backup deleted.");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const rows = useMemo<BackupRow[]>(
        () => backupsQuery.data?.data ?? [],
        [backupsQuery.data],
    );
    const anyMutationPending =
        createMutation.isPending ||
        restoreMutation.isPending ||
        deleteMutation.isPending;

    const openRestoreDialog = (backup: BackupMetadata) => {
        restoreMutation.reset();
        setRestoreConfirmation("");
        setSelectedRestore(backup);
    };

    const closeRestoreDialog = () => {
        if (restoreMutation.isPending) return;
        setSelectedRestore(null);
        setRestoreConfirmation("");
        restoreMutation.reset();
    };

    const openDeleteDialog = (backup: BackupMetadata) => {
        deleteMutation.reset();
        setSelectedDelete(backup);
    };

    const closeDeleteDialog = () => {
        if (deleteMutation.isPending) return;
        setSelectedDelete(null);
        deleteMutation.reset();
    };

    const columns: ColumnDef<BackupRow>[] = [
        {
            accessorKey: "filename",
            header: "Filename",
            cell: ({ row }) => (
                <span
                    className="block break-all font-medium"
                    title={row.original.filename}
                >
                    {row.original.filename}
                </span>
            ),
            size: 310,
        },
        {
            accessorKey: "size",
            header: "Size",
            cell: ({ row }) => (
                <span className="whitespace-nowrap tabular-nums">
                    {formatFileSize(row.original.size)}
                </span>
            ),
            size: 110,
        },
        {
            accessorKey: "created_at",
            header: "Created",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-sm">
                    {formatCreatedAt(row.original.created_at)}
                </span>
            ),
            size: 190,
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <div className="flex flex-wrap justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openRestoreDialog(row.original)}
                        disabled={anyMutationPending}
                    >
                        <RotateCcwIcon />
                        {restoreMutation.isPending &&
                        selectedRestore?.filename === row.original.filename
                            ? "Restoring..."
                            : "Restore"}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(row.original)}
                        disabled={anyMutationPending}
                    >
                        <Trash2Icon />
                        {deleteMutation.isPending &&
                        selectedDelete?.filename === row.original.filename
                            ? "Deleting..."
                            : "Delete"}
                    </Button>
                </div>
            ),
            size: 230,
        },
    ];

    const restoreIsConfirmed = restoreConfirmation === RESTORE_CONFIRMATION;

    return (
        <div className="min-w-0 space-y-6">
            <ScreenBackLink to="/admin" label="Dashboard" hideFrom="md" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Backup &amp; Restore
                    </h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                        Create private database recovery snapshots and manage existing
                        backups. Restore only when administrative recovery is required.
                    </p>
                </div>
                <Button
                    type="button"
                    className="w-full sm:w-auto"
                    onClick={() => createMutation.mutate()}
                    disabled={anyMutationPending}
                >
                    <DatabaseBackupIcon />
                    {createMutation.isPending ? "Creating..." : "Create backup"}
                </Button>
            </div>

            <Card className="border-border/80 min-w-0 overflow-hidden p-0 shadow-sm">
                <CardHeader className="px-6 pt-6">
                    <CardTitle>Database backups</CardTitle>
                    <CardDescription>
                        Recovery snapshots stored privately by the Core service.
                    </CardDescription>
                </CardHeader>
                {backupsQuery.isPending ? (
                    <DataTableSkeleton columnCount={4} />
                ) : backupsQuery.isError ? (
                    <CardContent className="space-y-4 pb-6">
                        <div>
                            <p className="font-medium">Backups could not be loaded.</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {getApiErrorMessage(backupsQuery.error)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void backupsQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                ) : rows.length === 0 ? (
                    <CardContent className="pb-10 text-center">
                        <DatabaseBackupIcon className="text-muted-foreground mx-auto size-10" />
                        <p className="mt-4 font-medium">No database backups yet</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Create a recovery snapshot when one is needed.
                        </p>
                    </CardContent>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchPlaceholder="Search backups by filename..."
                    />
                )}
            </Card>

            <Dialog
                open={Boolean(selectedRestore)}
                onOpenChange={(open) => {
                    if (!open) closeRestoreDialog();
                }}
            >
                <DialogContent showCloseButton={!restoreMutation.isPending}>
                    <DialogHeader>
                        <DialogTitle>Restore this database backup?</DialogTitle>
                        <DialogDescription>
                            Restoring replaces the active database state with the selected
                            SQL backup. Verify that this is the intended recovery snapshot
                            before continuing.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="border-destructive/30 bg-destructive/5 space-y-2 rounded-lg border p-4">
                        <div className="text-destructive flex items-center gap-2 font-medium">
                            <ShieldAlertIcon className="size-4" />
                            High-impact recovery action
                        </div>
                        <p className="break-all text-sm font-medium">
                            {selectedRestore?.filename}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="restore-confirmation">
                            Type <span className="font-mono">{RESTORE_CONFIRMATION}</span> to confirm
                        </Label>
                        <Input
                            id="restore-confirmation"
                            value={restoreConfirmation}
                            onChange={(event) =>
                                setRestoreConfirmation(event.target.value)
                            }
                            autoComplete="off"
                            disabled={restoreMutation.isPending}
                            placeholder={RESTORE_CONFIRMATION}
                        />
                    </div>
                    {restoreMutation.isError ? (
                        <p className="text-destructive text-sm" role="alert">
                            {getApiErrorMessage(restoreMutation.error)}
                        </p>
                    ) : null}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeRestoreDialog}
                            disabled={restoreMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                if (selectedRestore && restoreIsConfirmed) {
                                    restoreMutation.mutate(selectedRestore.filename);
                                }
                            }}
                            disabled={!selectedRestore || !restoreIsConfirmed || restoreMutation.isPending}
                        >
                            {restoreMutation.isPending
                                ? "Restoring database..."
                                : "Restore database"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(selectedDelete)}
                onOpenChange={(open) => {
                    if (!open) closeDeleteDialog();
                }}
            >
                <DialogContent showCloseButton={!deleteMutation.isPending}>
                    <DialogHeader>
                        <DialogTitle>Delete this database backup?</DialogTitle>
                        <DialogDescription>
                            This permanently removes the selected recovery snapshot and
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/40 rounded-lg border p-4">
                        <p className="break-all font-medium">
                            {selectedDelete?.filename}
                        </p>
                    </div>
                    {deleteMutation.isError ? (
                        <p className="text-destructive text-sm" role="alert">
                            {getApiErrorMessage(deleteMutation.error)}
                        </p>
                    ) : null}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeDeleteDialog}
                            disabled={deleteMutation.isPending}
                        >
                            Keep backup
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                if (selectedDelete) {
                                    deleteMutation.mutate(selectedDelete.filename);
                                }
                            }}
                            disabled={!selectedDelete || deleteMutation.isPending}
                        >
                            {deleteMutation.isPending
                                ? "Deleting..."
                                : "Delete permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminBackupPage;
