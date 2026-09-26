import { DashboardPanel } from "@/components/app/DashboardPanel";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useRouterState } from "@tanstack/react-router";

const copy: Record<string, { title: string; body: string }> = {
    settings: {
        title: "Settings",
        body: "System and tenant settings will live here. Contact your engineering team to connect configuration storage.",
    },
};

const AdminStubPage = () => {
    const path = useRouterState({ select: (s) => s.location.pathname });
    const key = path.split("/").pop() ?? "";
    const c = copy[key] ?? { title: "Admin", body: "This section is not available." };

    return (
        <div className="space-y-4">
            <ScreenBackLink to="/admin" label="Dashboard" hideFrom="md" />
            <DashboardPanel title={c.title}>
                <p className="text-muted-foreground text-sm leading-relaxed">{c.body}</p>
            </DashboardPanel>
        </div>
    );
};

export default AdminStubPage;
