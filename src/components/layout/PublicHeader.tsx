import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { usePublicAuthState } from "@/hooks/use-public-auth-state";
import { BRAND_NAV_NAME } from "@/lib/brand";
import { clearActiveRole, type ActiveRole } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
    Building2Icon,
    HomeIcon,
    InfoIcon,
    LayoutDashboardIcon,
    LogOutIcon,
    MenuIcon,
    UsersIcon,
    type LucideIcon,
} from "lucide-react";
import { useState } from "react";

type Props = {
    sticky?: boolean;
};

type PublicNavItem = {
    label: string;
    to: string;
    icon: LucideIcon;
    matches: (pathname: string) => boolean;
};

const matchesSection = (pathname: string, base: string) =>
    pathname === base || pathname.startsWith(`${base}/`);

const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
    {
        label: "Home",
        to: "/",
        icon: HomeIcon,
        matches: (pathname) => pathname === "/",
    },
    {
        label: "Properties",
        to: "/properties",
        icon: Building2Icon,
        matches: (pathname) =>
            matchesSection(pathname, "/properties") || matchesSection(pathname, "/property"),
    },
    {
        label: "Agents",
        to: "/agents",
        icon: UsersIcon,
        matches: (pathname) => matchesSection(pathname, "/agents"),
    },
    {
        label: "About",
        to: "/about",
        icon: InfoIcon,
        matches: (pathname) => matchesSection(pathname, "/about"),
    },
];

const DASHBOARD_DESTINATIONS: Record<ActiveRole, string> = {
    client: "/dashboard",
    agent: "/dashboard/agent",
    admin: "/admin",
};

export const PublicHeader = ({ sticky = false }: Props) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const {
        resolvedRole,
        isCheckingRole,
        hasAmbiguousRoles,
        clientAuth,
        agentAuth,
        adminAuth,
    } = usePublicAuthState();

    const logoutPending =
        resolvedRole === "client"
            ? clientAuth.logoutMutation.isPending
            : resolvedRole === "agent"
              ? agentAuth.logoutMutation.isPending
              : resolvedRole === "admin"
                ? adminAuth.logoutMutation.isPending
                : false;

    const handleSignOut = () => {
        if (!resolvedRole) return;

        const onSettled = () => {
            clearActiveRole();
            setMobileOpen(false);
            navigate({ to: "/auth/login", replace: true });
        };

        if (resolvedRole === "client") {
            clientAuth.logoutMutation.mutate(undefined, { onSettled });
        } else if (resolvedRole === "agent") {
            agentAuth.logoutMutation.mutate(undefined, { onSettled });
        } else {
            adminAuth.logoutMutation.mutate(undefined, { onSettled });
        }
    };

    const renderAccountActions = (mobile: boolean) => {
        if (resolvedRole) {
            return (
                <div className={cn("flex items-center gap-2", mobile && "w-full flex-col gap-3")}>
                    <Button
                        variant="outline"
                        size={mobile ? "default" : "sm"}
                        className={cn("gap-2", mobile && "h-11 w-full justify-start")}
                        asChild
                    >
                        <Link
                            to={DASHBOARD_DESTINATIONS[resolvedRole]}
                            onClick={() => setMobileOpen(false)}
                        >
                            <LayoutDashboardIcon className="size-4" aria-hidden />
                            Dashboard
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size={mobile ? "default" : "sm"}
                        className={cn(
                            "text-destructive hover:bg-destructive/10 hover:text-destructive gap-2",
                            mobile && "h-11 w-full justify-start",
                        )}
                        disabled={logoutPending}
                        onClick={handleSignOut}
                    >
                        <LogOutIcon className="size-4" aria-hidden />
                        {logoutPending ? "Signing out..." : "Sign out"}
                    </Button>
                </div>
            );
        }

        if (isCheckingRole) {
            return (
                <p className="text-muted-foreground px-3 py-2 text-sm" role="status">
                    Checking account...
                </p>
            );
        }

        if (hasAmbiguousRoles) {
            return (
                <p
                    className="border-border bg-muted/40 text-muted-foreground max-w-64 rounded-lg border px-3 py-2 text-sm"
                    role="status"
                >
                    Account actions are unavailable. Please sign in again to select an active account.
                </p>
            );
        }

        return (
            <div className={cn("flex items-center gap-2", mobile && "w-full flex-col gap-3")}>
                <Button
                    variant="ghost"
                    size={mobile ? "default" : "sm"}
                    className={cn("font-medium", mobile && "h-11 w-full")}
                    asChild
                >
                    <Link to="/auth/login" onClick={() => setMobileOpen(false)}>
                        Login
                    </Link>
                </Button>
                <Button
                    size={mobile ? "default" : "sm"}
                    className={cn("rounded-lg font-medium", mobile && "h-11 w-full")}
                    asChild
                >
                    <Link to="/auth/register" onClick={() => setMobileOpen(false)}>
                        Register
                    </Link>
                </Button>
            </div>
        );
    };

    const renderNavLinks = (mobile: boolean) =>
        PUBLIC_NAV_ITEMS.map((item) => {
            const isActive = item.matches(pathname);
            const Icon = item.icon;

            return (
                <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-lg font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
                        mobile ? "px-3 py-3.5 text-base leading-none" : "px-3 py-2 text-sm",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/75 hover:bg-primary/10 hover:text-primary",
                    )}
                    onClick={() => mobile && setMobileOpen(false)}
                >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                </Link>
            );
        });

    return (
        <header
            className={cn(
                "border-border bg-card/95 z-50 border-b backdrop-blur-md",
                sticky && "sticky top-0",
            )}
        >
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-4 md:px-12 lg:px-14">
                <Link
                    to="/"
                    aria-label="AFFORDAHOMES home"
                    className="focus-visible:ring-primary/40 flex min-w-0 shrink items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
                >
                    <BrandLogo variant="nav" compact />
                    <span className="text-foreground truncate text-sm font-semibold tracking-tight sm:text-base">
                        {BRAND_NAV_NAME}
                    </span>
                </Link>

                <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
                    {renderNavLinks(false)}
                </nav>

                <div className="hidden items-center lg:flex">{renderAccountActions(false)}</div>

                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-foreground -mr-1 size-10 shrink-0 lg:hidden"
                            aria-label="Open menu"
                        >
                            <MenuIcon className="size-5" aria-hidden />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="right"
                        className="flex w-[min(100%,22rem)] max-w-[calc(100vw-0.75rem)] flex-col gap-0 border-l p-0 sm:max-w-sm"
                    >
                        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-8 pt-5">
                            <SheetHeader className="border-border/70 space-y-0 border-b p-0 pb-4">
                                <SheetTitle className="text-foreground pr-10 text-left text-lg font-semibold tracking-tight">
                                    Menu
                                </SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col gap-1 py-4" aria-label="Mobile navigation">
                                {renderNavLinks(true)}
                            </nav>
                            <div className="border-border/70 mt-auto border-t pt-5">
                                {renderAccountActions(true)}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
};
