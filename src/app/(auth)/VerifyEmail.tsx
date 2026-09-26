import { authApi } from "@/db/api/auth.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { AuthNav } from "@/components/layout/AuthNav";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2Icon } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const VerifyEmail = () => {
    const navigate = useNavigate();

    const { client_id: clientId, token } = useMemo(() => {
        const p = new URLSearchParams(window.location.search);
        return { client_id: p.get("client_id") ?? "", token: p.get("token") ?? "" };
    }, []);

    const isValidLink = Boolean(clientId && token);

    /** useQuery (not mutation + effect) so Strict Mode does not fire duplicate verifies and strand isPending. */
    const verifyQuery = useQuery({
        queryKey: ["auth", "verify-email", clientId, token],
        queryFn: () => authApi.verifyClientEmail({ client_id: clientId, token }),
        enabled: isValidLink,
        retry: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    const errorToastSent = useRef(false);
    useEffect(() => {
        if (!verifyQuery.isError || errorToastSent.current) return;
        errorToastSent.current = true;
        toast.error(getApiErrorMessage(verifyQuery.error));
    }, [verifyQuery.isError, verifyQuery.error]);

    return (
        <div className="flex h-screen flex-col">
            <AuthNav />

            <div className="grid flex-1 lg:grid-cols-[480px_1fr]">
                <div className="bg-primary relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
                    <div className="bg-white/5 absolute -top-24 -left-24 size-96 rounded-full" />
                    <div className="bg-white/5 absolute -right-16 -bottom-16 size-72 rounded-full" />
                    <div className="relative flex items-center">
                        <BrandLogo variant="authPanel" />
                    </div>
                    <div className="relative space-y-4">
                        <h2 className="text-primary-foreground text-4xl leading-tight font-bold">
                            Verify your<br />
                            email
                        </h2>
                        <p className="text-primary-foreground/70 max-w-xs text-base leading-relaxed">
                            One moment while we confirm your address.
                        </p>
                    </div>
                    <p className="text-primary-foreground/40 relative text-sm">Quality homes in Pampanga since 2010.</p>
                </div>

                <div className="bg-background flex items-center justify-center p-8">
                    <div className="w-full max-w-sm space-y-6 text-center">
                        <div className="flex justify-start lg:hidden">
                            <ScreenBackLink to="/auth/login" label="Sign in" />
                        </div>
                        <div className="flex justify-center lg:hidden">
                            <BrandLogo variant="authMobile" />
                        </div>

                        {!isValidLink && (
                            <>
                                <AlertTriangle className="text-destructive mx-auto size-12" />
                                <h1 className="text-2xl font-bold tracking-tight">Invalid link</h1>
                                <p className="text-muted-foreground text-sm">
                                    This verification link is incomplete. Register again or request a new link from
                                    sign in.
                                </p>
                                <Button className="w-full" asChild>
                                    <Link to="/auth/login">Sign in</Link>
                                </Button>
                            </>
                        )}

                        {isValidLink && !verifyQuery.isSuccess && !verifyQuery.isError && (
                            <>
                                <Loader2Icon className="text-primary mx-auto size-12 animate-spin" />
                                <h1 className="text-2xl font-bold tracking-tight">Verifying…</h1>
                                <p className="text-muted-foreground text-sm">Please wait.</p>
                            </>
                        )}

                        {isValidLink && verifyQuery.isSuccess && (
                            <>
                                <CheckCircle2 className="text-primary mx-auto size-12" />
                                <h1 className="text-2xl font-bold tracking-tight">Email verified</h1>
                                <p className="text-muted-foreground text-sm">
                                    {verifyQuery.data?.message?.toLowerCase().includes("already")
                                        ? "Your address was already confirmed. You can sign in with your password."
                                        : "You can now sign in with your password."}
                                </p>
                                <Button className="w-full" onClick={() => navigate({ to: "/auth/login", replace: true })}>
                                    Sign in
                                </Button>
                            </>
                        )}

                        {isValidLink && verifyQuery.isError && (
                            <>
                                <AlertTriangle className="text-destructive mx-auto size-12" />
                                <h1 className="text-2xl font-bold tracking-tight">Could not verify</h1>
                                <p className="text-muted-foreground text-sm">
                                    The link may have expired. Request a new one from the sign-in page.
                                </p>
                                <Button className="w-full" asChild>
                                    <Link to="/auth/login">Sign in</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
