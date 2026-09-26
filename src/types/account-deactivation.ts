export type AccountDeactivationScheduledData = {
    account_status: "pending_deactivation";
    deactivation_scheduled_at: string;
};

export type AccountDeactivationCancelledData = {
    account_status: "active";
};

export type AccountDeactivationErrorCode =
    | "ACCOUNT_PENDING_DEACTIVATION"
    | "ACCOUNT_DEACTIVATED";
