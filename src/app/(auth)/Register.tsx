import { useAuth } from "@/db/queries/useAuth";
import { publicApi } from "@/db/api/public.api";
import { getApiErrorData, getApiErrorMessage } from "@/lib/api-error";
import {
    evaluatePassword,
    PASSWORD_REQUIREMENTS,
} from "@/lib/password-policy";
import { cn } from "@/lib/utils";
import {
    registerFormSchema,
    type RegisterFormValues,
} from "@/validators/auth.validator";
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
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
    AlertCircleIcon,
    BadgeCheckIcon,
    CheckIcon,
    CircleIcon,
    EyeIcon,
    EyeOffIcon,
    LoaderCircleIcon,
} from "lucide-react";
import { useState } from "react";

const Register = () => {
    const navigate = useNavigate();
    const { ref } = useSearch({ from: "/auth/register" });
    const { registerMutation } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const hasReferralParameter = ref !== undefined;
    const requestedReferralCode = ref?.trim() ?? "";

    const referralQuery = useQuery({
        queryKey: ["public", "referral", requestedReferralCode],
        queryFn: () => publicApi.resolveReferral(requestedReferralCode),
        enabled: hasReferralParameter && requestedReferralCode.length > 0,
        retry: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const canonicalReferralCode = referralQuery.data?.data.valid
        ? referralQuery.data.data.referral_code
        : undefined;
    const referralErrorCode = referralQuery.error
        ? getApiErrorData(referralQuery.error)?.code
        : undefined;
    const isKnownInvalidReferral =
        hasReferralParameter &&
        (requestedReferralCode.length === 0 ||
            referralErrorCode === "INVALID_REFERRAL");
    const isReferralValidationUnavailable =
        hasReferralParameter &&
        referralQuery.isError &&
        !isKnownInvalidReferral;
    const isReferralValid =
        hasReferralParameter &&
        !referralQuery.isError &&
        !referralQuery.isFetching &&
        !!canonicalReferralCode;
    const isReferralValidating =
        hasReferralParameter &&
        requestedReferralCode.length > 0 &&
        referralQuery.isFetching;
    const canSubmitReferral = !hasReferralParameter || isReferralValid;

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerFormSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
            acceptTerms: false,
            privacyAcknowledged: false,
        },
    });
    const passwordValue = useWatch({
        control: form.control,
        name: "password",
    });
    const passwordEvaluation = evaluatePassword(passwordValue);

    const onSubmit = async (values: RegisterFormValues) => {
        if (!canSubmitReferral) {
            toast.error("Please resolve the referral link before creating your account.");
            return;
        }

        try {
            await registerMutation.mutateAsync({
                first_name: values.first_name.trim(),
                last_name: values.last_name.trim(),
                email: values.email.trim(),
                password: values.password,
                phone: values.phone.trim(),
                terms_accepted: values.acceptTerms,
                privacy_notice_acknowledged: values.privacyAcknowledged,
                ...(canonicalReferralCode
                    ? { referral_code: canonicalReferralCode }
                    : {}),
            });
            toast.success("Check your email to verify your address, then sign in.");
            if (canonicalReferralCode) {
                navigate({
                    to: "/auth/login",
                    search: { redirect: "/dashboard/inquiries" },
                });
            } else {
                navigate({ to: "/auth/login" });
            }
        } catch (e) {
            toast.error(getApiErrorMessage(e));

            if (
                hasReferralParameter &&
                getApiErrorData(e)?.code === "INVALID_REFERRAL"
            ) {
                void referralQuery.refetch();
            }
        }
    };

    const continueWithoutReferral = () => {
        navigate({
            to: "/auth/register",
            search: { ref: undefined },
            replace: true,
        });
    };

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
                            Find your<br />dream home
                        </h2>
                        <p className="text-primary-foreground/70 max-w-xs text-base leading-relaxed">
                            Create a free account to browse premium listings, schedule viewings, and get matched with an expert agent.
                        </p>
                    </div>

                    <p className="text-primary-foreground/40 relative text-sm">
                        Quality homes in Pampanga since 2010.
                    </p>
                </div>

                {/* Right — form */}
                <div className="bg-background flex items-center justify-center overflow-y-auto p-8">
                    <div className="w-full max-w-sm space-y-8">
                        <ScreenBackLink to="/auth/login" label="Sign in" className="lg:hidden" />

                        {/* Mobile brand */}
                        <div className="flex lg:hidden">
                            <BrandLogo variant="authMobile" />
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                            <p className="text-muted-foreground text-sm">
                                We will email you a link to verify your address before you can sign in.
                            </p>
                        </div>

                        {isReferralValidating ? (
                            <div
                                className="border-border bg-muted/30 flex items-start gap-3 rounded-lg border p-4"
                                role="status"
                            >
                                <LoaderCircleIcon
                                    className="text-primary mt-0.5 size-5 shrink-0 animate-spin"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="text-sm font-medium">Validating referral</p>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        Checking your AFFORDAHOMES referral link.
                                    </p>
                                </div>
                            </div>
                        ) : isReferralValid ? (
                            <div className="border-green-200 bg-green-50 flex items-start gap-3 rounded-lg border p-4 dark:border-green-900/60 dark:bg-green-950/30">
                                <BadgeCheckIcon
                                    className="mt-0.5 size-5 shrink-0 text-green-700 dark:text-green-400"
                                    aria-hidden="true"
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                        Referred by an AFFORDAHOMES agent
                                    </p>
                                    <p className="text-muted-foreground mt-0.5 break-all font-mono text-xs">
                                        {canonicalReferralCode}
                                    </p>
                                </div>
                            </div>
                        ) : isKnownInvalidReferral || isReferralValidationUnavailable ? (
                            <div
                                className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-4"
                                role="alert"
                            >
                                <div className="flex items-start gap-3">
                                    <AlertCircleIcon
                                        className="text-destructive mt-0.5 size-5 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {isKnownInvalidReferral
                                                ? "Invalid referral link"
                                                : "Referral validation unavailable"}
                                        </p>
                                        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                                            {isKnownInvalidReferral
                                                ? "This referral link is not valid. You can continue only after removing it."
                                                : getApiErrorMessage(referralQuery.error)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-8">
                                    {isReferralValidationUnavailable ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void referralQuery.refetch()}
                                        >
                                            Try again
                                        </Button>
                                    ) : null}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={continueWithoutReferral}
                                    >
                                        Continue without referral
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="first_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First name</FormLabel>
                                                <FormControl>
                                                    <Input className="h-11" autoComplete="given-name" placeholder="Juan" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="last_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last name</FormLabel>
                                                <FormControl>
                                                    <Input className="h-11" autoComplete="family-name" placeholder="Dela Cruz" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input className="h-11" type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Phone{" "}
                                                <span className="text-muted-foreground font-normal">(optional)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="h-11" type="tel" autoComplete="tel" placeholder="09XXXXXXXXX" {...field} />
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
                                            <FormLabel>Password</FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        className="h-11 pr-11"
                                                        type={showPassword ? "text" : "password"}
                                                        autoComplete="new-password"
                                                        placeholder="Enter your password"
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
                                            <div className="border-border bg-muted/30 space-y-3 rounded-lg border p-3">
                                                <div
                                                    className="flex items-center justify-between gap-3 text-xs font-medium"
                                                    role="status"
                                                    aria-live="polite"
                                                >
                                                    <span className="text-muted-foreground">
                                                        Password strength
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            passwordEvaluation.strength === "Strong"
                                                                ? "text-primary"
                                                                : passwordEvaluation.strength === "Fair"
                                                                  ? "text-amber-600"
                                                                  : "text-destructive",
                                                        )}
                                                    >
                                                        {passwordEvaluation.strength}
                                                    </span>
                                                </div>
                                                <div
                                                    className="grid grid-cols-5 gap-1"
                                                    aria-hidden
                                                >
                                                    {PASSWORD_REQUIREMENTS.map((requirement, index) => (
                                                        <span
                                                            key={requirement.key}
                                                            className={cn(
                                                                "bg-border h-1.5 rounded-full transition-colors duration-200 motion-reduce:transition-none",
                                                                index < passwordEvaluation.satisfiedCount &&
                                                                    (passwordEvaluation.strength === "Strong"
                                                                        ? "bg-primary"
                                                                        : passwordEvaluation.strength === "Fair"
                                                                          ? "bg-amber-500"
                                                                          : "bg-destructive"),
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                <ul
                                                    className="grid gap-1.5 text-xs sm:grid-cols-2"
                                                    aria-label="Password requirements"
                                                >
                                                    {PASSWORD_REQUIREMENTS.map((requirement) => {
                                                        const isMet =
                                                            passwordEvaluation.requirements[
                                                                requirement.key
                                                            ];

                                                        return (
                                                            <li
                                                                key={requirement.key}
                                                                className={cn(
                                                                    "flex items-center gap-2",
                                                                    isMet
                                                                        ? "text-primary"
                                                                        : "text-muted-foreground",
                                                                )}
                                                            >
                                                                {isMet ? (
                                                                    <CheckIcon
                                                                        className="size-3.5 shrink-0"
                                                                        aria-hidden
                                                                    />
                                                                ) : (
                                                                    <CircleIcon
                                                                        className="size-3.5 shrink-0"
                                                                        aria-hidden
                                                                    />
                                                                )}
                                                                <span className="sr-only">
                                                                    {isMet ? "Met: " : "Not met: "}
                                                                </span>
                                                                <span>{requirement.label}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm password</FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        className="h-11 pr-11"
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        autoComplete="new-password"
                                                        placeholder="Confirm your password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <button
                                                    type="button"
                                                    aria-label={
                                                        showConfirmPassword
                                                            ? "Hide confirm password"
                                                            : "Show confirm password"
                                                    }
                                                    aria-pressed={showConfirmPassword}
                                                    className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/40 absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                                    onClick={() =>
                                                        setShowConfirmPassword((current) => !current)
                                                    }
                                                >
                                                    {showConfirmPassword ? (
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
                                <div className="border-border bg-muted/30 space-y-4 rounded-lg border p-4">
                                    <FormField
                                        control={form.control}
                                        name="acceptTerms"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-start gap-3">
                                                    <FormControl>
                                                        <input
                                                            id="accept-terms"
                                                            type="checkbox"
                                                            checked={field.value}
                                                            onChange={(event) =>
                                                                field.onChange(event.target.checked)
                                                            }
                                                            onBlur={field.onBlur}
                                                            name={field.name}
                                                            ref={field.ref}
                                                            className="border-input text-primary focus-visible:ring-ring mt-0.5 size-4 shrink-0 rounded accent-[var(--primary)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                                        />
                                                    </FormControl>
                                                    <FormLabel
                                                        htmlFor="accept-terms"
                                                        className="text-muted-foreground block min-w-0 cursor-pointer text-sm leading-relaxed font-normal"
                                                    >
                                                        <span>
                                                            I have read and agree to the AFFORDAHOMES{" "}
                                                            <Link
                                                                to="/terms-and-conditions"
                                                                className="text-primary font-medium underline underline-offset-4"
                                                                onClick={(event) =>
                                                                    event.stopPropagation()
                                                                }
                                                            >
                                                                Terms &amp; Conditions
                                                            </Link>
                                                            .
                                                        </span>
                                                    </FormLabel>
                                                </div>
                                                <FormMessage className="pl-7" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="privacyAcknowledged"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-start gap-3">
                                                    <FormControl>
                                                        <input
                                                            id="acknowledge-privacy"
                                                            type="checkbox"
                                                            checked={field.value}
                                                            onChange={(event) =>
                                                                field.onChange(event.target.checked)
                                                            }
                                                            onBlur={field.onBlur}
                                                            name={field.name}
                                                            ref={field.ref}
                                                            className="border-input text-primary focus-visible:ring-ring mt-0.5 size-4 shrink-0 rounded accent-[var(--primary)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                                        />
                                                    </FormControl>
                                                    <FormLabel
                                                        htmlFor="acknowledge-privacy"
                                                        className="text-muted-foreground block min-w-0 cursor-pointer text-sm leading-relaxed font-normal"
                                                    >
                                                        <span>
                                                            I acknowledge that I have read the AFFORDAHOMES{" "}
                                                            <Link
                                                                to="/privacy-notice"
                                                                className="text-primary font-medium underline underline-offset-4"
                                                                onClick={(event) =>
                                                                    event.stopPropagation()
                                                                }
                                                            >
                                                                Privacy Notice
                                                            </Link>
                                                            .
                                                        </span>
                                                    </FormLabel>
                                                </div>
                                                <FormMessage className="pl-7" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="h-11 w-full"
                                    disabled={
                                        registerMutation.isPending ||
                                        !canSubmitReferral
                                    }
                                >
                                    {registerMutation.isPending ? "Creating account…" : "Create account"}
                                </Button>
                            </form>
                        </Form>

                        <p className="text-muted-foreground text-center text-sm">
                            Already have an account?{" "}
                            <Link
                                to="/auth/login"
                                className="text-primary font-medium underline-offset-4 hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
