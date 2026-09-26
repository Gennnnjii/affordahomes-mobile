import { useAdminAuth } from "@/db/queries/useAdminAuth";
import { getApiErrorMessage } from "@/lib/api-error";
import { loginRequestSchema, type LoginRequest } from "@/validators/auth.validator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShieldCheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const safeRedirect = (raw: string | undefined) => {
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/admin/agents";
};

const AdminLogin = () => {
    const navigate = useNavigate();
    const { loginMutation } = useAdminAuth();
    const redirectRaw = useRouterState({
        select: (s) => (s.location.search as { redirect?: string }).redirect,
    });

    const form = useForm<LoginRequest>({
        resolver: zodResolver(loginRequestSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (values: LoginRequest) => {
        try {
            await loginMutation.mutateAsync(values);
            toast.success("Signed in as admin.");
            navigate({ to: safeRedirect(redirectRaw) });
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    return (
        <div className="flex min-h-svh items-center justify-center p-4">
            <Card className="w-full max-w-3xl overflow-hidden p-0 shadow-lg">
                <div className="grid lg:grid-cols-2">

                    <div className="flex flex-col justify-between bg-slate-900 p-8 lg:p-10">
                        <div className="flex items-center gap-2">
                            <ShieldCheckIcon className="h-5 w-5 text-slate-300" />
                            <span className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
                                Admin Portal
                            </span>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold leading-snug text-white">
                                Administration
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-400">
                                Restricted access. Sign in with your administrator credentials to manage properties, agents, clients, and reservations.
                            </p>
                        </div>
                        <p className="text-xs text-slate-600">
                            Fiesta Communities &mdash; Internal use only.
                        </p>
                    </div>

                    <div className="flex flex-col">
                        <CardContent className="flex flex-1 flex-col justify-center p-8 lg:p-10">
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Enter your admin email and password.
                                </p>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                                        placeholder="admin@example.com"
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
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        autoComplete="current-password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={loginMutation.isPending}
                                    >
                                        {loginMutation.isPending ? "Signing in…" : "Sign in"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>

                        <CardFooter className="flex justify-center border-t px-8 py-5">
                            <Link to="/" className="text-muted-foreground text-sm hover:underline">
                                Back to site
                            </Link>
                        </CardFooter>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AdminLogin;
