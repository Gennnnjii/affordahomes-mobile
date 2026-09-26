import { authApi } from "@/db/api/auth.api";
import { getApiErrorMessage } from "@/lib/api-error";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CheckCircle2, AlertTriangle, EyeIcon, EyeOffIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { STRONG_PASSWORD_GUIDANCE } from "@/lib/password-policy";
import { strongPasswordSchema } from "@/validators/auth.validator";

const schema = z
    .object({
        password: strongPasswordSchema,
        password_confirmation: z.string().min(1, "Please confirm your password"),
    })
    .refine((v) => v.password === v.password_confirmation, {
        message: "Passwords do not match",
        path: ["password_confirmation"],
    });

type FormValues = z.infer<typeof schema>;

const ResetPassword = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    // Read ?token=...&email=... validated by the router's validateSearch
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") ?? "";
    const email = params.get("email") ?? "";

    const isValidLink = Boolean(token && email);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { password: "", password_confirmation: "" },
    });

    const resetMut = useMutation({
        mutationFn: (values: FormValues) =>
            authApi.resetPassword({
                email,
                token,
                password: values.password,
                password_confirmation: values.password_confirmation,
            }),
        onSuccess: () => {
            toast.success("Password reset! You can now sign in.");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const onSubmit = (values: FormValues) => resetMut.mutate(values);

    return (
        <div className="flex h-screen flex-col">
            <AuthNav />

            <div className="grid flex-1 lg:grid-cols-[480px_1fr]">

                {/* Left — brand panel */}
                <div className="bg-primary relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
                    <div className="bg-white/5 absolute -top-24 -left-24 size-96 rounded-full" />
                    <div className="bg-white/5 absolute -right-16 -bottom-16 size-72 rounded-full" />

                    <div className="relative flex items-center">
                        <BrandLogo variant="authPanel" />
                    </div>

                    <div className="relative space-y-4">
                        <h2 className="text-primary-foreground text-4xl leading-tight font-bold">
                            Choose a new<br />password
                        </h2>
                        <p className="text-primary-foreground/70 max-w-xs text-base leading-relaxed">
                            Pick something strong and memorable. Your account will be secured with the new password right away.
                        </p>
                    </div>

                    <p className="text-primary-foreground/40 relative text-sm">
                        Quality homes in Pampanga since 2010.
                    </p>
                </div>

                {/* Right — form */}
                <div className="bg-background flex items-center justify-center p-8">
                    <div className="w-full max-w-sm space-y-8">
                        <ScreenBackLink to="/auth/login" label="Sign in" className="lg:hidden" />

                        {/* Mobile brand */}
                        <div className="flex lg:hidden">
                            <BrandLogo variant="authMobile" />
                        </div>

                        {/* Invalid / missing link */}
                        {!isValidLink && (
                            <div className="space-y-4 text-center">
                                <AlertTriangle className="text-destructive mx-auto size-12" />
                                <h1 className="text-2xl font-bold tracking-tight">Invalid link</h1>
                                <p className="text-muted-foreground text-sm">
                                    This reset link is missing required information. Please request a new one.
                                </p>
                                <Link
                                    to="/auth/forgot-password"
                                    className="text-primary block text-sm font-medium underline-offset-4 hover:underline"
                                >
                                    Request a new reset link
                                </Link>
                            </div>
                        )}

                        {/* Success state */}
                        {isValidLink && resetMut.isSuccess && (
                            <div className="space-y-4 text-center">
                                <CheckCircle2 className="text-primary mx-auto size-12" />
                                <h1 className="text-2xl font-bold tracking-tight">Password updated</h1>
                                <p className="text-muted-foreground text-sm">
                                    Your password has been reset successfully.
                                </p>
                                <Button
                                    className="w-full"
                                    onClick={() => navigate({ to: "/auth/login", replace: true })}
                                >
                                    Sign in
                                </Button>
                            </div>
                        )}

                        {/* Form */}
                        {isValidLink && !resetMut.isSuccess && (
                            <>
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-bold tracking-tight">New password</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Resetting password for <span className="font-medium">{email}</span>.
                                    </p>
                                </div>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>New password</FormLabel>
                                                    <div className="relative">
                                                        <FormControl>
                                                            <Input
                                                                type={showPassword ? "text" : "password"}
                                                                autoComplete="new-password"
                                                                placeholder="Enter a strong password"
                                                                className="h-11 pr-11"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <button
                                                            type="button"
                                                            aria-label={
                                                                showPassword
                                                                    ? "Hide new password"
                                                                    : "Show new password"
                                                            }
                                                            aria-pressed={showPassword}
                                                            className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/40 absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                                            onClick={() =>
                                                                setShowPassword((current) => !current)
                                                            }
                                                        >
                                                            {showPassword ? (
                                                                <EyeOffIcon className="size-4" aria-hidden />
                                                            ) : (
                                                                <EyeIcon className="size-4" aria-hidden />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                                        {STRONG_PASSWORD_GUIDANCE}
                                                    </p>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="password_confirmation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Confirm new password</FormLabel>
                                                    <div className="relative">
                                                        <FormControl>
                                                            <Input
                                                                type={
                                                                    showPasswordConfirmation
                                                                        ? "text"
                                                                        : "password"
                                                                }
                                                                autoComplete="new-password"
                                                                className="h-11 pr-11"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <button
                                                            type="button"
                                                            aria-label={
                                                                showPasswordConfirmation
                                                                    ? "Hide password confirmation"
                                                                    : "Show password confirmation"
                                                            }
                                                            aria-pressed={showPasswordConfirmation}
                                                            className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/40 absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                                            onClick={() =>
                                                                setShowPasswordConfirmation(
                                                                    (current) => !current,
                                                                )
                                                            }
                                                        >
                                                            {showPasswordConfirmation ? (
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
                                            disabled={resetMut.isPending}
                                        >
                                            {resetMut.isPending ? "Updating…" : "Update password"}
                                        </Button>
                                    </form>
                                </Form>

                                <p className="text-muted-foreground text-center text-sm">
                                    Back to{" "}
                                    <Link
                                        to="/auth/login"
                                        className="text-primary font-medium underline-offset-4 hover:underline"
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
