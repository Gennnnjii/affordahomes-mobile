import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    value: number;
    max?: number;
    onChange?: (value: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizes = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
};

const labels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function StarRating({
    value,
    max = 5,
    onChange,
    readonly: readonlyProp,
    size = "md",
    className,
}: StarRatingProps) {
    const [hovered, setHovered] = useState(0);
    const readonly = readonlyProp ?? !onChange;
    const display = hovered || value;

    return (
        <div
            className={cn("flex items-center gap-0.5", className)}
            onMouseLeave={() => !readonly && setHovered(0)}
            role={readonly ? "img" : "radiogroup"}
            aria-label={readonly ? `Rating: ${value} out of ${max}` : "Select a rating"}
        >
            {Array.from({ length: max }, (_, i) => {
                const star = i + 1;
                const filled = star <= display;
                return (
                    <button
                        key={star}
                        type="button"
                        disabled={readonly}
                        onClick={() => !readonly && onChange?.(star)}
                        onMouseEnter={() => !readonly && setHovered(star)}
                        aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                        className={cn(
                            "transition-transform focus:outline-none",
                            !readonly && "cursor-pointer hover:scale-110",
                            readonly && "cursor-default",
                        )}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className={cn(sizes[size], "transition-colors")}
                            fill={filled ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth={filled ? "0" : "1.5"}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                            />
                        </svg>
                    </button>
                );
            })}

            {!readonly && display > 0 && (
                <span className="text-muted-foreground ml-2 text-sm">
                    {labels[display]}
                </span>
            )}
        </div>
    );
}
