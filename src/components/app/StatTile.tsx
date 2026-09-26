import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
    icon: LucideIcon;
    value: string | number;
    label: string;
    className?: string;
};

export const StatTile = ({ icon: Icon, value, label, className }: Props) => {
    return (
        <Card
            className={cn(
                "border-border/80 flex flex-row items-center gap-3.5 rounded-xl p-5 shadow-sm",
                className,
            )}
        >
            <div className="bg-primary/15 text-primary flex size-[52px] shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
                <p className="text-foreground text-2xl font-semibold tracking-tight">{value}</p>
                <p className="text-muted-foreground text-sm">{label}</p>
            </div>
        </Card>
    );
};
