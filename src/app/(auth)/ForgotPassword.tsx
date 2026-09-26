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
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const schema = z.object({
    email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

const ForgotPassword = () => {
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "" },
    });

    const sendMut = useMutation({
        mutationFn: (values: FormValues) => authApi.forgotPassword(values.email),
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const onSubmit = (values: FormValues) => sendMut.mutate(values);

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
                            Forgot your<br />password?
                        </h2>
                        <p className="text-primary-foreground/70 max-w-xs text-base leading-relaxed">
                            No worries. Enter your registered email and we'll send you a secure link to reset it.
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

                        {sendMut.isSuccess ? (
                            <div className="space-y-4 text-center">
                                <CheckCircle2 className="text-primary mx-auto size-12" />
                                <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
                                <p className="text-muted-foreground text-sm">
                                    If <span className="font-medium">{form.getValues("email")}</span> is
                                    registered, a reset link has been sent. It expires in 60 minutes.
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    Didn't receive it? Check your spam folder or{" "}
                                    <button
                                        type="button"
                                        className="text-primary underline-offset-4 hover:underline"
                                        onClick={() => sendMut.reset()}
                                    >
                                        try again
                                    </button>
                                    .
                                </p>
                                <Link
                                    to="/auth/login"
                                    className="text-primary block text-sm font-medium underline-offset-4 hover:underline"
                                >
                                    Back to sign in
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Enter your account email and we'll send you a reset link.
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

                                        <Button
                                            type="submit"
                                            className="h-11 w-full"
                                            disabled={sendMut.isPending}
                                        >
                                            {sendMut.isPending ? "Sending…" : "Send reset link"}
                                        </Button>
                                    </form>
                                </Form>

                                <p className="text-muted-foreground text-center text-sm">
                                    Remember your password?{" "}
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

export default ForgotPassword;
