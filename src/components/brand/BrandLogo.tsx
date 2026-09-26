import {
    BRAND_COMPACT_LOGO_SRC,
    BRAND_LOGO_ALT,
    BRAND_LOGO_SRC,
} from "@/lib/brand";
import { cn } from "@/lib/utils";

const variantClass = {
    /** Header nav (landing + auth) */
    nav: "size-9 sm:size-10",
    /** Footer first column */
    footer: "size-24",
    /** Dashboard sidebar header */
    sidebar: "size-16",
    /** Auth layout left panel on primary */
    authPanel: "size-28 rounded-xl bg-white/95 p-2 shadow-sm sm:size-32",
    /** Auth layout mobile top */
    authMobile: "size-20",
} as const;

export type BrandLogoVariant = keyof typeof variantClass;

type Props = {
    variant: BrandLogoVariant;
    className?: string;
    compact?: boolean;
};

export const BrandLogo = ({ variant, className, compact = false }: Props) => (
    <img
        src={compact ? BRAND_COMPACT_LOGO_SRC : BRAND_LOGO_SRC}
        alt={BRAND_LOGO_ALT}
        className={cn(
            "shrink-0 object-contain object-center",
            variantClass[variant],
            className,
        )}
        decoding="async"
    />
);
