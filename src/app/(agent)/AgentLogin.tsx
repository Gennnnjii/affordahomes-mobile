import { useAgentAuth } from "@/db/queries/useAgentAuth";
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
import { BriefcaseIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const safeRedirect = (raw: string | undefined) => {
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/dashboard/agent";
};

const AgentLogin = () => {
    const navigate = useNavigate();
    const { loginMutation } = useAgentAuth();
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
            toast.success("Signed in as agent.");
            navigate({ to: safeRedirect(redirectRaw) });
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    return (
        <div className="flex min-h-svh items-center justify-center p-4">
            <Card className="w-full max-w-3xl overflow-hidden p-0 shadow-lg">
                <div className="grid lg:grid-cols-2">

                    <div className="flex flex-col justify-between bg-indigo-900 p-8 lg:p-10">
                        <div className="flex items-center gap-2">
                            <BriefcaseIcon className="h-5 w-5 text-indigo-300" />
                            <span className="text-sm font-semibold tracking-wide text-indigo-300 uppercase">
                                Agent Workspace
                            </span>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold leading-snug text-white">
                                Your workspace
                            </h2>
                            <p className="text-sm leading-relaxed text-indigo-300/80">
                                Sign in to view your assigned clients, manage property listings, and track reservations from your personal dashboard.
                            </p>
                        </div>
                        <p className="text-xs text-indigo-900/40 text-white/20">
                            Fiesta Communities &mdash; Agent portal.
                        </p>
                    </div>

                    <div className="flex flex-col">
                        <CardContent className="flex flex-1 flex-col justify-center p-8 lg:p-10">
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold tracking-tight">Agent sign in</h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Enter your agent credentials to continue.
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
                                                        placeholder="agent@example.com"
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

export default AgentLogin;
