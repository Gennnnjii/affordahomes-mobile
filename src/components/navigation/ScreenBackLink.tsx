import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HideFrom = "md" | "lg";

type Props = {
    to: string;
    label?: string;
    /** Hide from this breakpoint up (sidebar / desktop nav available). */
    hideFrom?: HideFrom;
    className?: string;
};

const hideFromClass: Record<HideFrom, string> = {
    md: "md:hidden",
    lg: "lg:hidden",
};

/**
 * Prominent back control for WebView / Capacitor (stack navigation without browser chrome).
 */
export const ScreenBackLink = ({ to, label = "Back", hideFrom, className }: Props) => (
    <div className={cn("flex", hideFrom ? hideFromClass[hideFrom] : undefined, className)}>
        <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2 h-9 gap-1 px-2"
            asChild
        >
            <Link to={to}>
                <ChevronLeft className="size-5 shrink-0" aria-hidden />
                <span className="text-sm font-medium">{label}</span>
            </Link>
        </Button>
    </div>
);
