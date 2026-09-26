import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

type Props = {
    title: string;
    actionLabel?: string;
    actionTo?: string;

    flush?: boolean;
    children: ReactNode;
    className?: string;
};

export const DashboardPanel = ({ title, actionLabel, actionTo, flush, children, className }: Props) => {
    return (
        <Card className={cn("border-border/80 overflow-hidden rounded-xl py-0 shadow-sm", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-3 pt-5">
                <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>
                {actionLabel && actionTo ? (
                    <Link
                        to={actionTo}
                        className="text-primary text-sm font-semibold hover:underline"
                    >
                        {actionLabel}
                    </Link>
                ) : null}
            </CardHeader>
            <CardContent className={flush ? "p-0" : "px-6 pb-6 pt-0"}>{children}</CardContent>
        </Card>
    );
};
