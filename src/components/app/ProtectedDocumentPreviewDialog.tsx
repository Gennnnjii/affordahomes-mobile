import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useRef, useState } from "react";

type ProtectedDocumentPreviewDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fetchDocument: () => Promise<Blob>;
    title?: string;
};

export function ProtectedDocumentPreviewDialog({
    open,
    onOpenChange,
    fetchDocument,
    title = "Protected document preview",
}: ProtectedDocumentPreviewDialogProps) {
    const [attempt, setAttempt] = useState(0);
    const [preview, setPreview] = useState<{ url: string; type: string } | null>(null);
    const [hasError, setHasError] = useState(false);
    const fetchDocumentRef = useRef(fetchDocument);

    useEffect(() => {
        if (!open) return;

        let active = true;
        let objectUrl: string | null = null;

        void fetchDocumentRef.current()
            .then((blob) => {
                if (!active) return;
                objectUrl = URL.createObjectURL(blob);
                setPreview({ url: objectUrl, type: blob.type });
            })
            .catch(() => {
                if (active) setHasError(true);
            });

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [attempt, open]);

    const retry = () => {
        setPreview(null);
        setHasError(false);
        setAttempt((current) => current + 1);
    };

    const isPdf = preview?.type.toLowerCase().includes("pdf") ?? false;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col gap-0 overflow-hidden p-0"
                style={{ maxWidth: "min(92vw, 1100px)", height: "90vh" }}
            >
                <DialogHeader className="shrink-0 border-b px-4 py-3 pr-12">
                    <DialogTitle className="text-sm font-medium">{title}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Secure preview of the uploaded identity document.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted flex flex-1 items-center justify-center overflow-hidden">
                    {hasError ? (
                        <div className="max-w-sm space-y-3 px-6 text-center">
                            <p className="text-destructive text-sm" role="alert">
                                Could not load this protected document. Please try again.
                            </p>
                            <Button type="button" variant="outline" size="sm" onClick={retry}>
                                Retry
                            </Button>
                        </div>
                    ) : preview ? (
                        isPdf ? (
                            <iframe
                                src={preview.url}
                                title={title}
                                className="h-full w-full border-0"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
                                <img
                                    src={preview.url}
                                    alt={title}
                                    className="max-h-full w-auto object-contain"
                                />
                            </div>
                        )
                    ) : (
                        <div className="flex items-center gap-2 text-sm">
                            <Spinner className="size-4" />
                            Loading protected document...
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
