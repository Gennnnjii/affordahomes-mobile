import { authApi, isAgentOtpRequired } from "@/db/api/auth.api";
import { replaceRoleSession } from "@/lib/auth-session-cache";
import { setActiveRole, setAdminToken } from "@/lib/tokens";
import { getApiErrorData, getApiErrorMessage } from "@/lib/api-error";
import { loginRequestSchema, type LoginRequest } from "@/validators/auth.validator";
import { AuthNav } from "@/components/layout/AuthNav";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { z } from "zod";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CalendarClockIcon, EyeIcon, EyeOffIcon, ShieldAlertIcon } from "lucide-react";
import type { AccountDeactivationErrorCode } from "@/types/account-deactivation";

const ROLE_DESTINATIONS = {
    admin: "/admin",
    agent: "/dashboard/agent",
    client: "/",
} as const;

const CLIENT_ONBOARDING_REDIRECT = "/dashboard/inquiries" as const;

const otpSchema = z.object({
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type OtpForm = z.infer<typeof otpSchema>;

type AccountLifecycleNotice = {
    code: AccountDeactivationErrorCode;
    deactivationScheduledAt: string | null;
};

const formatDeactivationDeadline = (value: string | null): string | null => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
    });
};

const Login = () => {
    const navigate = useNavigate();
    const { redirect } = useSearch({ from: "/auth/login" });
    const queryClient = useQueryClient();
    const [agentChallengeId, setAgentChallengeId] = useState<string | null>(null);
    const [agentEmailMasked, setAgentEmailMasked] = useState("");
    const [showUnverifiedHelp, setShowUnverifiedHelp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [accountLifecycleNotice, setAccountLifecycleNotice] =
        useState<AccountLifecycleNotice | null>(null);
    const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);
    const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);

    const form = useForm<LoginRequest>({
        resolver: zodResolver(loginRequestSchema),
        defaultValues: { email: "", password: "" },
    });

    const otpForm = useForm<OtpForm>({
        resolver: zodResolver(otpSchema),
        defaultValues: { code: "" },
    });

    const recoveryForm = useForm<LoginRequest>({
        resolver: zodResolver(loginRequestSchema),
        defaultValues: { email: "", password: "" },
    });

    const loginMut = useMutation({
        mutationFn: authApi.unifiedLogin,
        onMutate: () => {
            setShowUnverifiedHelp(false);
            setAccountLifecycleNotice(null);
            setIsRecoveryDialogOpen(false);
            setShowRecoveryPassword(false);
            recoveryForm.reset({ email: "", password: "" });
        },
        onSuccess: (res) => {
            setShowUnverifiedHelp(false);
            setAccountLifecycleNotice(null);
            const payload = res.data;
            if (isAgentOtpRequired(payload)) {
                setAgentChallengeId(payload.challenge_id);
                setAgentEmailMasked(form.getValues("email").trim());
                toast.success("Check your email for a 6-digit code.");
                return;
            }
            const { role, access_token } = payload;
            if (role === "admin") setAdminToken(access_token);
            if (role === "agent") replaceRoleSession(queryClient, "agent", access_token);
            if (role === "client") replaceRoleSession(queryClient, "client", access_token);
            setActiveRole(role);
            toast.success("Signed in successfully.");
            const dest =
                role === "client" && redirect === CLIENT_ONBOARDING_REDIRECT
                    ? CLIENT_ONBOARDING_REDIRECT
                    : ROLE_DESTINATIONS[role];
            navigate({ to: dest, replace: true });
        },
        onError: (e) => {
            const data = getApiErrorData(e);
            const code = data?.code;
            setShowUnverifiedHelp(code === "EMAIL_UNVERIFIED");

            if (
                code === "ACCOUNT_PENDING_DEACTIVATION" ||
                code === "ACCOUNT_DEACTIVATED"
            ) {
                setAccountLifecycleNotice({
                    code,
                    deactivationScheduledAt:
                        typeof data?.deactivation_scheduled_at === "string"
                            ? data.deactivation_scheduled_at
                            : null,
                });
                form.setValue("password", "");
                setShowPassword(false);
            }
            toast.error(getApiErrorMessage(e));
        },
    });

    const cancelDeactivationMut = useMutation({
        mutationFn: authApi.cancelDeactivationWithCredentials,
        onSuccess: () => {
            recoveryForm.reset({ email: "", password: "" });
            setShowRecoveryPassword(false);
            setIsRecoveryDialogOpen(false);
            setAccountLifecycleNotice(null);
            cancelDeactivationMut.reset();
            toast.success("Account deactivation cancelled. You may now log in normally.");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const otpMut = useMutation({
        mutationFn: authApi.verifyAgentLoginOtp,
        onSuccess: (res) => {
            const { access_token } = res.data;
            replaceRoleSession(queryClient, "agent", access_token);
            setActiveRole("agent");
            toast.success("Signed in successfully.");
            setAgentChallengeId(null);
            setAgentEmailMasked("");
            navigate({ to: ROLE_DESTINATIONS.agent, replace: true });
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const resendMut = useMutation({
        mutationFn: () => authApi.resendVerificationEmail(form.getValues("email").trim()),
        onSuccess: () => {
            toast.success("If this email is unverified, a new link has been sent.");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const onSubmit = (values: LoginRequest) => loginMut.mutate(values);

    const handleRecoveryDialogOpenChange = (open: boolean) => {
        if (cancelDeactivationMut.isPending) return;

        setIsRecoveryDialogOpen(open);
        setShowRecoveryPassword(false);
        recoveryForm.reset({
            email: open ? form.getValues("email").trim() : "",
            password: "",
        });
        if (!open) cancelDeactivationMut.reset();
    };

    const pendingDeadline =
        accountLifecycleNotice?.code === "ACCOUNT_PENDING_DEACTIVATION"
            ? formatDeactivationDeadline(
                  accountLifecycleNotice.deactivationScheduledAt,
              )
            : null;

    const onSubmitOtp = (values: OtpForm) => {
        if (!agentChallengeId) return;
        otpMut.mutate({ challenge_id: agentChallengeId, code: values.code });
    };

    const cancelAgentOtp = () => {
        setAgentChallengeId(null);
        setAgentEmailMasked("");
        otpForm.reset();
    };

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
                            Welcome
                            <br />
                            back
                        </h2>
                        <p className="text-primary-foreground/70 max-w-xs text-base leading-relaxed">
                            Sign in to browse properties, track your reservations, and connect with your agent.
                        </p>
                    </div>

                    <p className="text-primary-foreground/40 relative text-sm">Quality homes in Pampanga since 2010.</p>
                </div>

                <div className="bg-background flex items-center justify-center overflow-y-auto p-8">
                    <div className="w-full max-w-sm space-y-8">
                        <ScreenBackLink to="/" label="Home" className="lg:hidden" />
                        <div className="flex lg:hidden">
                            <BrandLogo variant="authMobile" />
                        </div>

                        {agentChallengeId ? (
                            <>
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-bold tracking-tight">Agent verification</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Enter the 6-digit code sent to{" "}
                                        <span className="text-foreground font-medium">{agentEmailMasked}</span>.
                                    </p>
                                </div>

                                <Form {...otpForm}>
                                    <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-5">
                                        <FormField
                                            control={otpForm.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>One-time code</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="text"
                                                            inputMode="numeric"
                                                            autoComplete="one-time-code"
                                                            autoFocus
                                                            placeholder="000000"
                                                            className="h-11 text-center text-xl tracking-[0.5em]"
                                                            maxLength={6}
                                                            name={field.name}
                                                            ref={field.ref}
                                                            onBlur={field.onBlur}
                                                            value={field.value}
                                                            onChange={(e) => {
                                                                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                                otpForm.setValue("code", digits, {
                                                                    shouldValidate: true,
                                                                    shouldDirty: true,
                                                                });
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            className="h-11 w-full"
                                            disabled={otpMut.isPending}
                                        >
                                            {otpMut.isPending ? "Verifying…" : "Continue"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full"
                                            onClick={cancelAgentOtp}
                                        >
                                            Use a different account
                                        </Button>
                                    </form>
                                </Form>
                            </>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Enter your email and password to continue.
                                    </p>
                                </div>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            autoComplete="email"
                                                            placeholder="you@example.com"
                                                            className="h-11"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel>Password</FormLabel>
                                                        <Link
                                                            to="/auth/forgot-password"
                                                            className="text-muted-foreground hover:text-primary text-xs underline-offset-4 hover:underline"
                                                        >
                                                            Forgot password?
                                                        </Link>
                                                    </div>
                                                    <div className="relative">
                                                        <FormControl>
                                                            <Input
                                                                type={showPassword ? "text" : "password"}
                                                                autoComplete="current-password"
                                                                placeholder="Enter your password"
                                                                className="h-11 pr-11"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <button
                                                            type="button"
                                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                                            aria-pressed={showPassword}
                                                            className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/40 absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                                            onClick={() => setShowPassword((current) => !current)}
                                                        >
                                                            {showPassword ? (
                                                                <EyeOffIcon className="size-4" aria-hidden />
                                                            ) : (
                                                                <EyeIcon className="size-4" aria-hidden />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            className="h-11 w-full"
                                            disabled={loginMut.isPending}
                                        >
                                            {loginMut.isPending ? "Signing in…" : "Sign in"}
                                        </Button>
                                    </form>
                                </Form>

                                {accountLifecycleNotice?.code ===
                                "ACCOUNT_PENDING_DEACTIVATION" ? (
                                    <div
                                        className="border-amber-200 bg-amber-50 space-y-3 rounded-lg border p-4 text-sm"
                                        role="status"
                                    >
                                        <div className="flex items-start gap-3">
                                            <ShieldAlertIcon
                                                className="mt-0.5 size-5 shrink-0 text-amber-700"
                                                aria-hidden
                                            />
                                            <div className="min-w-0 space-y-1">
                                                <p className="font-medium text-amber-950">
                                                    Account deactivation is pending
                                                </p>
                                                <p className="text-amber-900/80 leading-relaxed">
                                                    Normal login does not cancel this request.
                                                    Cancellation must be confirmed separately.
                                                </p>
                                            </div>
                                        </div>
                                        {pendingDeadline ? (
                                            <div className="flex items-start gap-2 text-amber-900/80">
                                                <CalendarClockIcon
                                                    className="mt-0.5 size-4 shrink-0"
                                                    aria-hidden
                                                />
                                                <span className="break-words">
                                                    Scheduled deadline: {pendingDeadline}
                                                </span>
                                            </div>
                                        ) : null}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-amber-300 bg-white hover:bg-amber-100"
                                            onClick={() =>
                                                handleRecoveryDialogOpenChange(true)
                                            }
                                        >
                                            Cancel account deactivation
                                        </Button>
                                    </div>
                                ) : null}

                                {accountLifecycleNotice?.code ===
                                "ACCOUNT_DEACTIVATED" ? (
                                    <div
                                        className="border-border bg-muted/40 flex items-start gap-3 rounded-lg border p-4 text-sm"
                                        role="status"
                                    >
                                        <ShieldAlertIcon
                                            className="text-muted-foreground mt-0.5 size-5 shrink-0"
                                            aria-hidden
                                        />
                                        <div className="min-w-0 space-y-1">
                                            <p className="font-medium">Account deactivated</p>
                                            <p className="text-muted-foreground leading-relaxed">
                                                This account is deactivated. Self-service
                                                reactivation is not available.
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                {showUnverifiedHelp ? (
                                    <div className="border-border/80 bg-muted/40 space-y-3 rounded-lg border p-4 text-sm">
                                        <p className="text-muted-foreground">
                                            New accounts must verify email before signing in.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            disabled={resendMut.isPending || !form.getValues("email").trim()}
                                            onClick={() => resendMut.mutate()}
                                        >
                                            {resendMut.isPending ? "Sending…" : "Resend verification email"}
                                        </Button>
                                    </div>
                                ) : null}

                                <p className="text-muted-foreground text-center text-sm">
                                    No account?{" "}
                                    <Link
                                        to="/auth/register"
                                        className="text-primary font-medium underline-offset-4 hover:underline"
                                    >
                                        Register
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Dialog
                open={isRecoveryDialogOpen}
                onOpenChange={handleRecoveryDialogOpenChange}
            >
                <DialogContent
                    className="max-h-[90dvh] overflow-y-auto sm:max-w-md"
                    showCloseButton={!cancelDeactivationMut.isPending}
                >
                    <Form {...recoveryForm}>
                        <form
                            className="space-y-5"
                            onSubmit={recoveryForm.handleSubmit((values) =>
                                cancelDeactivationMut.mutate({
                                    email: values.email.trim(),
                                    password: values.password,
                                }),
                            )}
                        >
                            <DialogHeader>
                                <DialogTitle>Cancel account deactivation</DialogTitle>
                                <DialogDescription>
                                    Confirm your email and re-enter your current password. This
                                    does not sign you in automatically.
                                </DialogDescription>
                            </DialogHeader>

                            <FormField
                                control={recoveryForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                autoComplete="email"
                                                disabled={cancelDeactivationMut.isPending}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={recoveryForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current password</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input
                                                    type={
                                                        showRecoveryPassword ? "text" : "password"
                                                    }
                                                    autoComplete="current-password"
                                                    className="pr-11"
                                                    disabled={
                                                        cancelDeactivationMut.isPending
                                                    }
                                                    {...field}
                                                />
                                            </FormControl>
                                            <button
                                                type="button"
                                                aria-label={
                                                    showRecoveryPassword
                                                        ? "Hide current password"
                                                        : "Show current password"
                                                }
                                                aria-pressed={showRecoveryPassword}
                                                className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/40 absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                                disabled={cancelDeactivationMut.isPending}
                                                onClick={() =>
                                                    setShowRecoveryPassword(
                                                        (current) => !current,
                                                    )
                                                }
                                            >
                                                {showRecoveryPassword ? (
                                                    <EyeOffIcon
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                ) : (
                                                    <EyeIcon className="size-4" aria-hidden />
                                                )}
                                            </button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={cancelDeactivationMut.isPending}
                                    onClick={() =>
                                        handleRecoveryDialogOpenChange(false)
                                    }
                                >
                                    Keep request
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={cancelDeactivationMut.isPending}
                                >
                                    {cancelDeactivationMut.isPending
                                        ? "Cancelling…"
                                        : "Cancel deactivation"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Login;
