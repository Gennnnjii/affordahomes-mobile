import { rootRoute } from "./root.route.base";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ClientDashboardLayout } from "../components/layout/ClientDashboardLayout";
import { AgentDashboardLayout } from "../components/layout/AgentDashboardLayout";
import { AdminDashboardLayout } from "../components/layout/AdminDashboardLayout";
import { clientAuthMiddleware } from "@/middleware/clientAuthMiddleware";
import { agentAuthMiddleware } from "@/middleware/agentAuthMiddleware";
import { adminAuthMiddleware } from "@/middleware/adminAuthMiddleware";
import LandingHome from "@/app/(landing)/LandingHome";
import LandingAgents from "@/app/(landing)/LandingAgents";
import LandingProperties from "@/app/(landing)/LandingProperties";
import LandingPropertyProjects from "@/app/(landing)/LandingPropertyProjects";
import LandingInventory from "@/app/(landing)/LandingInventory";
import LandingPropertyMap from "@/app/(landing)/LandingPropertyMap";
import LandingPropertyDetail from "@/app/(landing)/LandingPropertyDetail";
import LandingAbout from "@/app/(landing)/LandingAbout";
import PrivacyNotice from "@/app/(landing)/PrivacyNotice";
import TermsAndConditions from "@/app/(landing)/TermsAndConditions";
import Login from "@/app/(auth)/Login";
import Register from "@/app/(auth)/Register";
import ForgotPassword from "@/app/(auth)/ForgotPassword";
import ResetPassword from "@/app/(auth)/ResetPassword";
import VerifyEmail from "@/app/(auth)/VerifyEmail";
import ClientHome from "@/app/(client)/ClientHome";
import ClientAppointments from "@/app/(client)/ClientAppointments";
import ClientAppointmentDetail from "@/app/(client)/ClientAppointmentDetail";
import ClientPropertiesBrowse from "@/app/(client)/ClientPropertiesBrowse";
import ClientChatPage from "@/app/(client)/ClientChatPage";
import ClientChatConversationPage from "@/app/(client)/ClientChatConversationPage";
import ClientInquiriesPage from "@/app/(client)/ClientInquiriesPage";
import ClientInquiryDetail from "@/app/(client)/ClientInquiryDetail";
import ClientReservations from "@/app/(client)/ClientReservations";
import ClientReservationDetail from "@/app/(client)/ClientReservationDetail";
import ClientMyAgent from "@/app/(client)/ClientMyAgent";
import ClientPrequalificationPage from "@/app/(client)/ClientPrequalificationPage";
import ClientJourneyTracker from "@/app/(client)/ClientJourneyTracker";
import ClientProfile from "@/app/(client)/ClientProfile";
import ClientOpenHousePage from "@/app/(client)/ClientOpenHousePage";
import ClientOpenHouseDetail from "@/app/(client)/ClientOpenHouseDetail";
import ClientOpenHouseRegistrations from "@/app/(client)/ClientOpenHouseRegistrations";
import ClientOpenHouseRegistrationDetail from "@/app/(client)/ClientOpenHouseRegistrationDetail";
import AgentHome from "@/app/(agent)/AgentHome";
import AgentPropertiesPage from "@/app/(agent)/AgentPropertiesPage";
import AgentPropertyDetailPage from "@/app/(agent)/AgentPropertyDetailPage";
import AgentReservationsPage from "@/app/(agent)/AgentReservationsPage";
import AgentChatPage from "@/app/(agent)/AgentChatPage";
import AgentReservationDetail from "@/app/(agent)/AgentReservationDetail";
import AgentReservationRecordDetail from "@/app/(agent)/AgentReservationRecordDetail";
import AgentAppointmentsPage from "@/app/(agent)/AgentAppointmentsPage";
import AgentAppointmentDetail from "@/app/(agent)/AgentAppointmentDetail";
import AgentProfilePage from "@/app/(agent)/AgentProfilePage";
import AgentClientsPage from "@/app/(agent)/AgentClientsPage";
import AgentPrequalificationsPage from "@/app/(agent)/AgentPrequalificationsPage";
import AgentPrequalificationDetail from "@/app/(agent)/AgentPrequalificationDetail";
import AgentDocumentsPage from "@/app/(agent)/AgentDocumentsPage";
import AdminAgentsPage from "@/app/(admin)/AdminAgentsPage";
import AdminHomePage from "@/app/(admin)/AdminHomePage";
import AdminStubPage from "@/app/(admin)/AdminStubPage";
import AdminReportsPage from "@/app/(admin)/AdminReportsPage";
import AdminAppointmentsPage from "@/app/(admin)/AdminReservationsPage";
import AdminRequestsPage from "@/app/(admin)/AdminRequestsPage";
import AdminAgentCreatePage from "@/app/(admin)/AdminAgentCreatePage";
import AdminAgentUpdatePage from "@/app/(admin)/AdminAgentUpdatePage";
import AdminPropertiesPage from "@/app/(admin)/AdminPropertiesPage";
import AdminPropertyCreatePage from "@/app/(admin)/AdminPropertyCreatePage";
import AdminPropertyUpdatePage from "@/app/(admin)/AdminPropertyUpdatePage";
import AdminTimesheetPage from "@/app/(admin)/AdminTimesheetPage";
import AdminLeaderboardsPage from "@/app/(admin)/AdminLeaderboardsPage";
import AdminOpenHousePage from "@/app/(admin)/AdminOpenHousePage";
import AdminOpenHouseCreatePage from "@/app/(admin)/AdminOpenHouseCreatePage";
import AdminOpenHouseDetail from "@/app/(admin)/AdminOpenHouseDetail";
import AdminOpenHouseUpdatePage from "@/app/(admin)/AdminOpenHouseUpdatePage";
import AdminBackupPage from "@/app/(admin)/AdminBackupPage";
import { createRoute, Navigate } from "@tanstack/react-router";
import type { InventoryLotStatus } from "@/types/inventory";

export { rootRoute };

const landingHomeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: LandingHome,
});

const landingAgentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/agents",
    component: LandingAgents,
});

const landingPropertiesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/properties",
    component: LandingPropertyProjects,
});

const landingPropertyMapRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/properties/map",
    validateSearch: (search: Record<string, unknown>) => ({
        map: typeof search.map === "string" && search.map !== "" ? search.map : undefined,
    }),
    component: LandingPropertyMap,
});

const INVENTORY_LOT_STATUSES: readonly InventoryLotStatus[] = [
    "available",
    "reserved",
    "sold",
    "on_hold",
];

const normalizedSearchId = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;

    const normalized = value.trim();
    return normalized === "" ? undefined : normalized;
};

const normalizedInventoryStatus = (value: unknown): InventoryLotStatus | undefined =>
    typeof value === "string" &&
    INVENTORY_LOT_STATUSES.includes(value as InventoryLotStatus)
        ? (value as InventoryLotStatus)
        : undefined;

const normalizedInventoryPage = (value: unknown): number => {
    const candidate =
        typeof value === "number"
            ? value
            : typeof value === "string" && value.trim() !== ""
              ? Number(value)
              : Number.NaN;

    return Number.isInteger(candidate) && candidate > 0 ? candidate : 1;
};

const landingInventoryRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/properties/inventory",
    validateSearch: (search: Record<string, unknown>) => ({
        project: normalizedSearchId(search.project),
        model: normalizedSearchId(search.model),
        block: normalizedSearchId(search.block),
        status: normalizedInventoryStatus(search.status),
        page: normalizedInventoryPage(search.page),
    }),
    component: LandingInventory,
});

const landingProjectPropertiesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/properties/$projectSlug",
    component: LandingProperties,
});

const landingAboutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/about",
    component: LandingAbout,
});

const landingPropertyDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/property/$propertyId",
    component: LandingPropertyDetail,
});

const privacyNoticeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/privacy-notice",
    component: PrivacyNotice,
});

const termsAndConditionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/terms-and-conditions",
    component: TermsAndConditions,
});

const authLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "auth",
    component: AuthLayout,
});

const authLoginRoute = createRoute({
    getParentRoute: () => authLayoutRoute,
    path: "login",
    validateSearch: (search: Record<string, unknown>) => ({
        redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    }),
    component: Login,
});

const authRegisterRoute = createRoute({
    getParentRoute: () => authLayoutRoute,
    path: "register",
    validateSearch: (search: Record<string, unknown>) => ({
        ref: typeof search.ref === "string" ? search.ref : undefined,
    }),
    component: Register,
});

const authForgotPasswordRoute = createRoute({
    getParentRoute: () => authLayoutRoute,
    path: "forgot-password",
    component: ForgotPassword,
});

const authResetPasswordRoute = createRoute({
    getParentRoute: () => authLayoutRoute,
    path: "reset-password",
    validateSearch: (search: Record<string, unknown>) => ({
        token: typeof search.token === "string" ? search.token : "",
        email: typeof search.email === "string" ? search.email : "",
    }),
    component: ResetPassword,
});

const authVerifyEmailRoute = createRoute({
    getParentRoute: () => authLayoutRoute,
    path: "verify-email",
    validateSearch: (search: Record<string, unknown>) => ({
        client_id: typeof search.client_id === "string" ? search.client_id : "",
        token: typeof search.token === "string" ? search.token : "",
    }),
    component: VerifyEmail,
});

// agent/login and admin/login redirect to the unified login page
const agentLoginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "agent/login",
    component: () => <Navigate to="/auth/login" replace />,
});

const adminLoginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "admin/login",
    component: () => <Navigate to="/auth/login" replace />,
});

const clientDashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "dashboard",
    beforeLoad: async ({ location }) => {
        await clientAuthMiddleware(location.pathname);
    },
    component: ClientDashboardLayout,
});

const clientIndexRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "/",
    component: ClientHome,
});

const clientAppointmentsRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "appointments",
    component: ClientAppointments,
});

const clientAppointmentDetailRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "appointment/$appointmentId",
    component: ClientAppointmentDetail,
});

const clientPropertiesRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "properties",
    component: ClientPropertiesBrowse,
});

const clientInquiriesRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "inquiries",
    component: ClientInquiriesPage,
});

const clientChatRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "chat",
    component: ClientChatPage,
});

const clientChatConversationRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "chat/$inquiryId",
    component: ClientChatConversationPage,
});

const clientInquiryDetailRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "inquiries/$inquiryId",
    component: ClientInquiryDetail,
});

const clientReservationsRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "reservations",
    component: ClientReservations,
});

const clientReservationDetailRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "reservation/$reservationId",
    component: ClientReservationDetail,
});

const clientJourneyRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "journey",
    component: ClientJourneyTracker,
});

const clientPrequalificationRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "prequalification",
    component: ClientPrequalificationPage,
});

const clientMyAgentRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "my-agent",
    component: ClientMyAgent,
});

const clientProfileRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "profile",
    component: ClientProfile,
});

const clientOpenHouseRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "open-house",
    component: ClientOpenHousePage,
});

const clientOpenHouseRegistrationsRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "open-house/registrations",
    component: ClientOpenHouseRegistrations,
});

const clientOpenHouseRegistrationDetailRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "open-house/registrations/$registrationId",
    component: ClientOpenHouseRegistrationDetail,
});

const clientOpenHouseDetailRoute = createRoute({
    getParentRoute: () => clientDashboardRoute,
    path: "open-house/$eventId",
    component: ClientOpenHouseDetail,
});

const agentDashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "dashboard/agent",
    beforeLoad: async ({ location }) => {
        await agentAuthMiddleware(location.pathname);
    },
    component: AgentDashboardLayout,
});

const agentIndexRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "/",
    component: AgentHome,
});

const agentPropertiesRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "properties",
    component: AgentPropertiesPage,
});

const agentPropertyDetailRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "properties/$propertyId",
    component: AgentPropertyDetailPage,
});


const agentReservationsRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "reservations",
    component: AgentReservationsPage,
});

const agentChatRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "chat",
    component: AgentChatPage,
});

const agentReservationDetailRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "reservation/$reservationId",
    component: AgentReservationDetail,
});

const agentReservationRecordDetailRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "reservations/$reservationId",
    component: AgentReservationRecordDetail,
});

const agentAppointmentsRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "appointments",
    component: AgentAppointmentsPage,
});

const agentAppointmentDetailRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "appointment/$appointmentId",
    component: AgentAppointmentDetail,
});

const agentProfileRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "profile",
    component: AgentProfilePage,
});

const agentClientsRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "clients",
    component: AgentClientsPage,
});

const agentPrequalificationsRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "prequalifications",
    component: AgentPrequalificationsPage,
});

const agentPrequalificationDetailRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "prequalification/$prequalificationId",
    component: AgentPrequalificationDetail,
});

const agentDocumentsRoute = createRoute({
    getParentRoute: () => agentDashboardRoute,
    path: "documents",
    component: AgentDocumentsPage,
});

const adminLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "admin",
    beforeLoad: async ({ location }) => {
        await adminAuthMiddleware(location.pathname);
    },
    component: AdminDashboardLayout,
});

const adminIndexRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "/",
    component: AdminHomePage,
});

const adminAppointmentsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "appointments",
    component: AdminAppointmentsPage,
});

const adminReservationsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "reservations",
    component: () => <Navigate to="/admin/appointments" replace />,
});

const adminRequestsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "requests",
    component: AdminRequestsPage,
});

const adminReportsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "reports",
    component: AdminReportsPage,
});

const adminBackupsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "backups",
    component: AdminBackupPage,
});

const adminSettingsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "settings",
    component: AdminStubPage,
});

const adminAgentsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "agents",
    component: AdminAgentsPage,
});

const adminAgentCreateRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "agents/create",
    component: AdminAgentCreatePage,
});

const adminAgentUpdateRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "agents/$agentId/update",
    component: AdminAgentUpdatePage,
});

const adminPropertiesRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "properties",
    component: AdminPropertiesPage,
});

const adminPropertyCreateRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "properties/create",
    component: AdminPropertyCreatePage,
});

const adminPropertyUpdateRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "properties/$propertyId/update",
    component: AdminPropertyUpdatePage,
});

const adminTimesheetRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "timesheets",
    component: AdminTimesheetPage,
});

const adminLeaderboardsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "leaderboards",
    component: AdminLeaderboardsPage,
});

const adminOpenHouseRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "open-house",
    component: AdminOpenHousePage,
});

const adminOpenHouseCreateRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "open-house/create",
    component: AdminOpenHouseCreatePage,
});

const adminOpenHouseUpdateRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "open-house/$eventId/update",
    component: AdminOpenHouseUpdatePage,
});

const adminOpenHouseDetailRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: "open-house/$eventId",
    component: AdminOpenHouseDetail,
});

export const routerTree = rootRoute.addChildren([
    landingHomeRoute,
    landingAgentsRoute,
    landingPropertiesRoute,
    landingPropertyMapRoute,
    landingInventoryRoute,
    landingProjectPropertiesRoute,
    landingAboutRoute,
    landingPropertyDetailRoute,
    privacyNoticeRoute,
    termsAndConditionsRoute,
    authLayoutRoute.addChildren([
        authLoginRoute,
        authRegisterRoute,
        authForgotPasswordRoute,
        authResetPasswordRoute,
        authVerifyEmailRoute,
    ]),
    agentLoginRoute,
    adminLoginRoute,
    clientDashboardRoute.addChildren([
        clientIndexRoute,
        clientAppointmentDetailRoute,
        clientReservationDetailRoute,
        clientAppointmentsRoute,
        clientPropertiesRoute,
        clientChatRoute,
        clientChatConversationRoute,
        clientInquiriesRoute,
        clientInquiryDetailRoute,
        clientJourneyRoute,
        clientPrequalificationRoute,
        clientReservationsRoute,
        clientMyAgentRoute,
        clientOpenHouseRoute,
        clientOpenHouseRegistrationsRoute,
        clientOpenHouseRegistrationDetailRoute,
        clientOpenHouseDetailRoute,
        clientProfileRoute,
    ]),
    agentDashboardRoute.addChildren([
        agentIndexRoute,
        agentReservationDetailRoute,
        agentReservationRecordDetailRoute,
        agentAppointmentDetailRoute,
        agentClientsRoute,
        agentPropertiesRoute,
        agentPropertyDetailRoute,
        agentReservationsRoute,
        agentChatRoute,
        agentAppointmentsRoute,
        agentProfileRoute,
        agentPrequalificationsRoute,
        agentPrequalificationDetailRoute,
        agentDocumentsRoute,
    ]),
    adminLayoutRoute.addChildren([
        adminIndexRoute,
        adminAgentCreateRoute,
        adminAgentUpdateRoute,
        adminAgentsRoute,
        adminPropertyCreateRoute,
        adminPropertyUpdateRoute,
        adminPropertiesRoute,
        adminAppointmentsRoute,
        adminReservationsRoute,
        adminRequestsRoute,
        adminReportsRoute,
        adminBackupsRoute,
        adminSettingsRoute,
        adminTimesheetRoute,
        adminLeaderboardsRoute,
        adminOpenHouseRoute,
        adminOpenHouseCreateRoute,
        adminOpenHouseUpdateRoute,
        adminOpenHouseDetailRoute,
    ]),
]);
