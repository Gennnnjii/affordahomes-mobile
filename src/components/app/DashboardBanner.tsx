import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type Props = {
    title: string;
    description: string;
    ctaLabel: string;
    ctaTo: string;
    imageSrc: string;
    imageAlt?: string;
    imageClassName?: string;
    extraActions?: ReactNode;
};

export const DashboardBanner = ({
    title,
    description,
    ctaLabel,
    ctaTo,
    imageSrc,
    imageAlt = "",
    imageClassName,
    extraActions,
}: Props) => {
    return (
        <Card className="border-border/80 grid overflow-hidden rounded-xl p-0 shadow-sm md:grid-cols-[1.1fr_0.9fr] md:gap-6 md:p-6">
            <div className="flex flex-col justify-center gap-3 p-6 md:p-0 md:pr-2">
                <h2 className="text-foreground text-2xl leading-tight font-semibold tracking-tight md:text-3xl">
                    {title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
                <div className="flex flex-wrap gap-3">
                    <Button asChild className="rounded-lg">
                        <Link to={ctaTo}>{ctaLabel}</Link>
                    </Button>
                    {extraActions}
                </div>
            </div>
            <div className="relative min-h-[200px] md:min-h-0">
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    className={cn(
                        "h-full w-full object-cover md:h-[260px] md:rounded-xl",
                        imageClassName,
                    )}
                />
            </div>
        </Card>
    );
};
