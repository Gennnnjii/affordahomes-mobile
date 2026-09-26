import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type SidebarNavItem = {
    to: string;
    label: string;
    icon?: LucideIcon;
    match?: "exact" | "prefix";
};

type Props = {
    productName: ReactNode;
    brandTo?: "/";

    portalSubtitle: string;

    mainTitle: string;

    welcomeName?: string;
    userInitial: string;
    items: SidebarNavItem[];
    logoutPending?: boolean;
    onLogout: () => void;
    showHeaderAccountMenu?: boolean;
    headerAction?: ReactNode;
    children: ReactNode;
};

const navButtonClass =
    "h-auto min-h-10 rounded-lg py-2.5 text-[15px] text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-primary";

const DashboardAccountMenu = ({
    userInitial,
    logoutPending,
    onLogout,
    compact = false,
}: {
    userInitial: string;
    logoutPending?: boolean;
    onLogout: () => void;
    compact?: boolean;
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                className={`bg-primary/15 text-primary flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-transparent transition-colors hover:bg-primary/25 focus-visible:ring-primary/40 focus-visible:outline-none ${compact ? "size-9 text-sm" : "size-[46px] text-base"}`}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
            >
                {userInitial}
            </button>
            {open ? (
                <div
                    role="menu"
                    className="bg-card border-border absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border p-1 shadow-lg"
                >
                    <button
                        type="button"
                        role="menuitem"
                        className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-50"
                        disabled={logoutPending}
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                    >
                        <LogOutIcon className="size-4" />
                        {logoutPending ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export const DashboardSidebarLayout = ({
    productName,
    brandTo,
    portalSubtitle,
    mainTitle,
    welcomeName,
    userInitial,
    items,
    logoutPending,
    onLogout,
    showHeaderAccountMenu,
    headerAction,
    children,
}: Props) => {
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    return (
        <SidebarProvider
            className="min-h-svh"
            style={{ "--sidebar-width": "16.875rem" } as CSSProperties}
        >
            <Sidebar collapsible="icon" className="border-sidebar-border">
                <SidebarHeader className="gap-1 border-b border-sidebar-border px-5 py-7">
                    <div className="group-data-[collapsible=icon]:hidden">
                        <div className="text-sidebar-foreground flex min-h-8 items-center text-lg font-semibold tracking-tight">
                            {brandTo ? (
                                <Link to={brandTo} className="inline-flex" aria-label="Go to AFFORDAHOMES home">
                                    {productName}
                                </Link>
                            ) : (
                                productName
                            )}
                        </div>
                        <p className="text-sidebar-foreground/55 mt-1 text-sm">{portalSubtitle}</p>
                    </div>
                </SidebarHeader>
                <SidebarContent className="px-3 py-2">
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-sidebar-foreground/45 mb-1 px-2 text-xs uppercase tracking-wide">
                            Menu
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-2">
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    const normalized = pathname.replace(/\/$/, "") || "/";
                                    const target = item.to.replace(/\/$/, "") || "/";
                                    const active =
                                        item.match === "exact"
                                            ? normalized === target
                                            : normalized === target ||
                                              (target !== "/" && normalized.startsWith(`${target}/`));
                                    return (
                                        <SidebarMenuItem key={item.to}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active}
                                                tooltip={item.label}
                                                className={navButtonClass}
                                            >
                                                <Link to={item.to}>
                                                    {Icon ? <Icon className="size-4 shrink-0" /> : null}
                                                    <span>{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className="border-sidebar-border border-t p-2">
                    <Button
                        variant="ghost"
                        className="text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground h-auto min-h-10 w-full justify-start gap-2 rounded-lg px-3 py-2.5"
                        disabled={logoutPending}
                        onClick={onLogout}
                    >
                        <LogOutIcon className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">Log out</span>
                    </Button>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="bg-[var(--dashboard-canvas)] min-w-0">
                <header className="border-border bg-card/90 sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 shadow-sm backdrop-blur-md md:hidden">
                    <SidebarTrigger className="text-muted-foreground" />
                    <span className="text-muted-foreground truncate text-sm font-medium">{mainTitle}</span>
                    {headerAction || showHeaderAccountMenu ? (
                        <div className="ml-auto flex items-center gap-2">
                            {headerAction}
                            {showHeaderAccountMenu ? (
                                <DashboardAccountMenu
                                    userInitial={userInitial}
                                    logoutPending={logoutPending}
                                    onLogout={onLogout}
                                    compact
                                />
                            ) : null}
                        </div>
                    ) : null}
                </header>
                <div className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
                    <div className="mb-6 hidden items-start justify-between gap-4 md:flex">
                        <div>
                            <h1 className="text-foreground text-3xl font-semibold tracking-tight">{mainTitle}</h1>
                            <p className="text-muted-foreground mt-1.5 text-sm">
                                Welcome back
                                {welcomeName ? <span className="text-foreground font-medium">, {welcomeName}</span> : null}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {headerAction}
                            {showHeaderAccountMenu ? (
                                <DashboardAccountMenu
                                    userInitial={userInitial}
                                    logoutPending={logoutPending}
                                    onLogout={onLogout}
                                />
                            ) : (
                                <div
                                    className="bg-primary/15 text-primary flex size-[46px] shrink-0 items-center justify-center rounded-full text-base font-semibold"
                                    aria-hidden
                                >
                                    {userInitial}
                                </div>
                            )}
                        </div>
                    </div>
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};
