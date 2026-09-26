export type BackupMetadata = {
    filename: string;
    size: number;
    created_at: string;
};

export type BackupRestoreResult = {
    filename: string;
    restored_at: string;
};
