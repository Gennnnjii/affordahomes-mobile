import { Spinner } from "@/components/ui/spinner";

interface SubmitOverlayProps {
    show: boolean;
    label?: string;
}



export const SubmitOverlay = ({ show, label = "Saving…" }: SubmitOverlayProps) => {
    if (!show) return null;
    return (
        <div
            role="status"
            aria-label={label}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/80 backdrop-blur-[2px]"
        >
            <Spinner className="text-primary size-7" />
            <p className="text-foreground text-sm font-medium">{label}</p>
        </div>
    );
};
