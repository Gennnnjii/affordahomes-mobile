import { LandingChrome } from "@/components/layout/LandingChrome";
import { AiChatWidget } from "@/components/app/AiChatWidget";
import { publicApi } from "@/db/api/public.api";
import { formatPhpCurrency } from "@/lib/format-php-currency";
import { asRecord, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicAuthState } from "@/hooks/use-public-auth-state";
import { cn } from "@/lib/utils";
import { normalizePropertyStatus, propertyStatusBadgeClass, propertyStatusLabel } from "@/lib/property-status";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BedDoubleIcon, ChevronDownIcon, HomeIcon, MapPinIcon, ShowerHeadIcon, UserRoundIcon } from "lucide-react";

const FAQ_ITEMS: { q: string; a: string }[] = [
    {
        q: "What is the process to reserve a property?",
        a: "Create an account, complete your prequalification by uploading your financial documents (payslip, Pag-IBIG membership proof, valid ID), then browse our listings and click \"Reserve now\" on any available property. Our agent will get in touch to confirm your site trip.",
    },
    {
        q: "What is prequalification and why is it required?",
        a: "Prequalification is a brief financial check where we verify your employment status, monthly income, and Pag-IBIG membership. It ensures we recommend homes that fit your budget and helps speed up the reservation process.",
    },
    {
        q: "What documents do I need to submit?",
        a: "You will need: (1) a payslip or proof of income, (2) a Pag-IBIG membership document or contribution record, and (3) a valid government-issued ID. You can upload these directly in your client portal under \"My Documents\".",
    },
    {
        q: "What is a Salary Bracket and how does it affect my loan?",
        a: "Your salary bracket is used to determine if your monthly income qualifies for a Pag-IBIG housing loan. The general guideline is that your gross monthly income should be at least 1.6% of the property's total price (e.g., for a ₱1,000,000 home, you need at least ₱16,000/month). If your income is below this, our agents will suggest other options or payment schemes.",
    },
    {
        q: "What is a Client Appointment Slip (CAS)?",
        a: "The CAS is an official document generated when your site visit is confirmed. It has two validity periods: the Site Tripping Request (valid for 1 month) and the Site Tripping Accomplishment (valid for 3 months once signed after the visit). It serves as proof of your appointment and protects both you and your assigned agent.",
    },
    {
        q: "What is a site trip / site visit?",
        a: "A site trip is a scheduled visit to the property location so you can view the actual unit, the surroundings, and the community. Your agent will coordinate the schedule with you and confirm a convenient date and time.",
    },
    {
        q: "Can I use Pag-IBIG financing?",
        a: "Yes, Fiesta Communities supports Pag-IBIG housing loans. Current Pag-IBIG interest rates range from 5.375% to 6.5% per year depending on your loan amount and term. You can use the amortization calculator on any property page to estimate your monthly payments.",
    },
    {
        q: "How long does the reservation process take?",
        a: "Once your documents are complete and prequalification is approved, reservations can be processed within a few business days. Site trips are typically scheduled within 1–2 weeks depending on availability.",
    },
];

const FaqAccordion = () => {
    const [open, setOpen] = useState<number | null>(null);
    return (
        <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="border-border/60 overflow-hidden rounded-xl border">
                    <button
                        type="button"
                        onClick={() => setOpen(open === i ? null : i)}
                        className="hover:bg-muted/50 flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors"
                    >
                        <span className="font-medium text-sm">{item.q}</span>
                        <ChevronDownIcon
                            className={`text-muted-foreground size-4 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
                        />
                    </button>
                    {open === i && (
                        <div className="border-border/60 border-t px-5 py-4">
                            <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const PropertyCardSkeleton = () => (
    <Card className="border-border/80 overflow-hidden rounded-xl p-0 shadow-sm">
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
        <CardContent className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-9 w-full" />
        </CardContent>
    </Card>
);

const AgentCardSkeleton = () => (
    <Card className="border-border/80 overflow-hidden rounded-xl p-0 shadow-sm">
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
        <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
        </div>
    </Card>
);

const LandingHome = () => {
    const { hasAuthenticatedSession, isCheckingRole } = usePublicAuthState();
    const { data: propsData, isPending: propsPending } = useQuery({
        queryKey: ["public", "properties"],
        queryFn: () => publicApi.properties(),
        staleTime: 60_000,
        refetchInterval: 2_000,
    });

    const { data: agentsData, isPending: agentsPending } = useQuery({
        queryKey: ["public", "agents"],
        queryFn: () => publicApi.agents(),
        staleTime: 60_000,
        refetchInterval: 2_000,
    });

    const featuredProps = ((propsData?.data as unknown[]) ?? []).slice(0, 6);
    const featuredAgents = ((agentsData?.data as unknown[]) ?? []).slice(0, 4);
    const showGuestRegistrationActions = !isCheckingRole && !hasAuthenticatedSession;

    return (
        <LandingChrome>

            <section className="px-4 py-10 sm:py-14 md:px-12 md:py-20 lg:px-14">
                <div className="border-primary/20 from-primary/20 via-primary/10 to-background relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border bg-gradient-to-br px-6 py-14 shadow-sm sm:px-10 md:py-20 lg:px-16">
                    <div className="bg-primary/10 absolute -right-20 -top-24 size-72 rounded-full blur-3xl" aria-hidden />
                    <div className="bg-primary/15 absolute -bottom-32 right-1/4 size-64 rounded-full blur-3xl" aria-hidden />
                    <div className="relative max-w-3xl">
                        <p className="text-primary mb-4 text-sm font-semibold uppercase tracking-[0.18em]">
                            Find your place in Pampanga
                        </p>
                        <h1 className="text-foreground text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl md:text-6xl">
                            Your dream home <br className="hidden sm:block" />
                            awaits in Pampanga
                        </h1>
                        <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
                            Discover quality living spaces in Dapdap, Dau, Kaya Homes, and Porac. Fiesta Communities brings
                            you closer to your perfect home with expert guidance and premium properties.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                            <Button size="lg" className="w-full rounded-lg px-6 shadow-sm sm:w-auto" asChild>
                                <Link to="/properties">View properties</Link>
                            </Button>
                            {showGuestRegistrationActions ? (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-primary/40 bg-background/80 text-primary hover:bg-primary/10 w-full rounded-lg px-6 sm:w-auto"
                                    asChild
                                >
                                    <Link to="/auth/register">Get started</Link>
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-14" id="about">
                <div className="mx-auto max-w-7xl px-4 md:px-12 lg:px-14">
                    <h2 className="text-foreground text-center text-3xl font-semibold tracking-tight">
                        Why Choose Fiesta Communities?
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center">
                        We&apos;re committed to providing quality homes and exceptional service to our clients
                    </p>
                    <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
                                <MapPinIcon className="size-8" strokeWidth={1.5} aria-hidden />
                            </div>
                            <h3 className="mt-5 text-lg font-semibold">Prime Locations</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
                                Strategic locations in Pampanga with easy access to major roads, schools, and
                                commercial centers.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
                                <HomeIcon className="size-8" strokeWidth={1.5} aria-hidden />
                            </div>
                            <h3 className="mt-5 text-lg font-semibold">Quality Homes</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
                                Expertly designed and built properties with modern amenities and durable
                                construction.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
                                <UserRoundIcon className="size-8" strokeWidth={1.5} aria-hidden />
                            </div>
                            <h3 className="mt-5 text-lg font-semibold">Expert Agents</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
                                Professional and dedicated agents to guide you through every step of your
                                home-buying journey.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-14">
                <div className="mx-auto max-w-7xl px-4 md:px-12 lg:px-14">
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2 className="text-foreground text-3xl font-semibold tracking-tight">
                                Featured properties
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Browse our latest listings available in Pampanga
                            </p>
                        </div>
                        <Link to="/properties" className="text-primary text-sm font-semibold hover:underline">
                            View all
                        </Link>
                    </div>

                    {propsPending ? (
                        <div className="grid gap-6 md:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <PropertyCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : featuredProps.length === 0 ? (
                        <p className="text-muted-foreground py-10 text-center text-sm">
                            No properties listed yet. Check back soon.
                        </p>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-3">
                            {featuredProps.map((raw) => {
                                const p = asRecord(raw);
                                const id = str(p.id) ?? "";
                                const title = str(p.title) ?? "Property";
                                const locationLines = [
                                    str(p.project),
                                    str(p.city_municipality),
                                    str(p.province),
                                ].filter(
                                    (line, index, lines): line is string =>
                                        Boolean(line) && lines.indexOf(line) === index,
                                );
                                const price = typeof p.price === "number" || typeof p.price === "string"
                                    ? Number(p.price)
                                    : null;
                                const status = normalizePropertyStatus(str(p.status));
                                const img = publicStorageUrl(str(p.main_image));
                                const beds = p.bedrooms != null ? String(p.bedrooms) : null;
                                const baths = p.bathrooms != null ? String(p.bathrooms) : null;
                                const area = p.floor_area_sqm != null ? `${p.floor_area_sqm} m²` : null;
                                const colorClass = propertyStatusBadgeClass(status);

                                return (
                                    <Card
                                        key={id}
                                        className="border-border/80 flex flex-col overflow-hidden rounded-xl p-0 shadow-sm"
                                    >
                                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                                            {img ? (
                                                <img
                                                    src={img}
                                                    alt={title}
                                                    className="size-full object-cover transition-transform duration-300 hover:scale-105"
                                                />
                                            ) : (
                                                <div className="bg-muted flex size-full items-center justify-center">
                                                    <HomeIcon className="text-muted-foreground/40 size-12" strokeWidth={1} />
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="flex flex-1 flex-col gap-2 p-5">
                                            <span
                                                className={cn(
                                                    "w-fit rounded-md px-2.5 py-0.5 text-xs font-semibold capitalize",
                                                    colorClass,
                                                )}
                                            >
                                                {propertyStatusLabel(status)}
                                            </span>
                                            <h3 className="text-base font-semibold leading-snug">{title}</h3>
                                            {locationLines.length > 0 && (
                                                <div className="text-muted-foreground flex items-start gap-1.5 text-sm">
                                                    <MapPinIcon className="text-primary mt-0.5 size-3.5 shrink-0" />
                                                    <div className="min-w-0 space-y-0.5">
                                                        {locationLines.map((line) => (
                                                            <p key={line} className="line-clamp-2">
                                                                {line}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-primary text-lg font-bold">
                                                {price !== null ? formatPhpCurrency(price) : "—"}
                                            </p>
                                            {(beds || baths || area) && (
                                                <p className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                                                    {beds && (
                                                        <span className="flex items-center gap-1">
                                                            <BedDoubleIcon className="size-3.5" />
                                                            {beds}
                                                        </span>
                                                    )}
                                                    {baths && (
                                                        <span className="flex items-center gap-1">
                                                            <ShowerHeadIcon className="size-3.5" />
                                                            {baths}
                                                        </span>
                                                    )}
                                                    {area && <span>{area}</span>}
                                                </p>
                                            )}
                                            <Button className="mt-auto w-full rounded-lg" size="sm" asChild>
                                                <Link to="/property/$propertyId" params={{ propertyId: id }}>
                                                    View details
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-muted/40 py-14">
                <div className="mx-auto max-w-7xl px-4 md:px-12 lg:px-14">
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2 className="text-foreground text-3xl font-semibold tracking-tight">
                                Meet our agents
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Experienced professionals ready to help you find the right home
                            </p>
                        </div>
                        <Link to="/agents" className="text-primary text-sm font-semibold hover:underline">
                            View all
                        </Link>
                    </div>

                    {agentsPending ? (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <AgentCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : featuredAgents.length === 0 ? (
                        <p className="text-muted-foreground py-10 text-center text-sm">
                            Agent profiles coming soon.
                        </p>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {featuredAgents.map((raw) => {
                                const a = asRecord(raw);
                                const id = str(a.id) ?? "";
                                const firstName = str(a.first_name) ?? "";
                                const lastName = str(a.last_name) ?? "";
                                const name = `${firstName} ${lastName}`.trim() || "Agent";
                                const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                                const photoSrc = publicStorageUrl(str(a.profile_picture));

                                return (
                                    <Card key={id} className="border-border/80 overflow-hidden rounded-xl p-0 shadow-sm">
                                        <div className="bg-muted aspect-square w-full overflow-hidden">
                                            {photoSrc ? (
                                                <img
                                                    src={photoSrc}
                                                    alt={name}
                                                    className="size-full object-cover object-top"
                                                />
                                            ) : (
                                                <div className="text-primary/40 flex size-full items-center justify-center bg-primary/8">
                                                    {initials ? (
                                                        <span className="text-3xl font-semibold tracking-tight">
                                                            {initials}
                                                        </span>
                                                    ) : (
                                                        <UserRoundIcon className="size-12" strokeWidth={1} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <p className="truncate font-bold">{name}</p>
                                            {str(a.position) && (
                                                <p className="text-primary mt-0.5 truncate text-xs font-semibold">
                                                    {str(a.position)}
                                                </p>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section className="py-16 md:py-20">
                <div className="mx-auto max-w-3xl px-4 md:px-12 lg:px-14">
                    <div className="mb-10 text-center">
                        <h2 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                            Frequently asked questions
                        </h2>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Common questions about our housing process and how we can help you.
                        </p>
                    </div>
                    <FaqAccordion />
                </div>
            </section>

            {showGuestRegistrationActions ? (
                <section className="bg-primary/10 py-16 md:py-20">
                    <div className="mx-auto max-w-7xl px-4 text-center md:px-12 lg:px-14">
                        <h2 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                            Ready to find your dream home?
                        </h2>
                        <p className="text-muted-foreground mt-3">
                            Register now and get connected with our expert agents
                        </p>
                        <Button size="lg" className="mt-8 rounded-lg px-8" asChild>
                            <Link to="/auth/register">Register now</Link>
                        </Button>
                    </div>
                </section>
            ) : null}
            <AiChatWidget />
        </LandingChrome>
    );
};

export default LandingHome;
