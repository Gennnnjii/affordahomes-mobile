import { LandingChrome } from "@/components/layout/LandingChrome";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
    EyeIcon,
    FileSignatureIcon,
    HandshakeIcon,
    MapPinIcon,
    TargetIcon,
    UsersIcon,
    BadgeCheckIcon,
    HomeIcon,
} from "lucide-react";

const HERO_IMAGE = "/images/dashboard/about.jpg";

const LandingAbout = () => {
    return (
        <LandingChrome>
            <div className="mx-auto max-w-7xl space-y-0 px-4 py-10 md:px-12 lg:px-14">
                <ScreenBackLink to="/" label="Home" className="mb-4" />
                <header className="border-border/60 space-y-3 border-b pb-10 text-center md:pb-12">
                    <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                        About Fiesta Communities
                    </h1>
                    <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed md:text-lg">
                        Building quality homes and growing communities in Pampanga since 2010
                    </p>
                </header>

                <section className="py-12 md:py-16">
                    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
                        <div className="border-border/80 overflow-hidden rounded-2xl border shadow-sm">
                            <img
                                src={HERO_IMAGE}
                                alt="Family walking through a Fiesta Communities neighborhood"
                                className="aspect-[4/3] w-full object-cover"
                                loading="eager"
                            />
                        </div>
                        <div className="space-y-5">
                            <h2 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                                Who we are
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Fiesta Communities is a trusted real estate developer focused on providing affordable,
                                quality, and family-friendly homes in key locations across Pampanga. We are committed to
                                helping individuals and families find not just a house, but a place they can truly call
                                home.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Over the years, we have continued to expand our communities in Dapdap, Dau, Kaya Homes,
                                and Porac, offering practical home options supported by dedicated service, reliable
                                agents, and a smooth home-buying experience.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-10 md:py-14">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-border/80 rounded-xl py-2 shadow-sm">
                            <CardContent className="space-y-4 pt-6">
                                <div className="text-primary">
                                    <TargetIcon className="size-10" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-semibold">Our mission</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    To provide quality and affordable housing solutions that help Filipino families
                                    achieve safe, comfortable, and meaningful homeownership.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border/80 rounded-xl py-2 shadow-sm">
                            <CardContent className="space-y-4 pt-6">
                                <div className="text-primary">
                                    <EyeIcon className="size-10" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-semibold">Our vision</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    To become one of the most trusted community builders in Pampanga by creating
                                    sustainable neighborhoods and long-term value for every homeowner.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="py-10 md:py-14">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                            Our core values
                        </h2>
                        <p className="text-muted-foreground mt-3 text-sm leading-relaxed md:text-base">
                            These values guide how we serve clients, build communities, and grow with integrity
                        </p>
                    </div>
                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        <Card className="border-border/80 rounded-xl py-2 shadow-sm">
                            <CardContent className="space-y-3 pt-6">
                                <div className="text-primary">
                                    <HandshakeIcon className="size-9" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-semibold">Integrity</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    We believe in honest service, transparent communication, and long-term trust with our
                                    clients.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border/80 rounded-xl py-2 shadow-sm">
                            <CardContent className="space-y-3 pt-6">
                                <div className="text-primary">
                                    <BadgeCheckIcon className="size-9" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-semibold">Quality</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    We build homes and communities with care, durability, and a strong focus on
                                    livability.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border/80 rounded-xl py-2 shadow-sm">
                            <CardContent className="space-y-3 pt-6">
                                <div className="text-primary">
                                    <UsersIcon className="size-9" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-semibold">Commitment</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    We are committed to supporting every client throughout their journey to
                                    homeownership.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="bg-muted/40 -mx-4 rounded-2xl px-4 py-12 md:-mx-12 md:px-12 lg:-mx-14 lg:px-14">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { stat: "15+", label: "Years of service" },
                            { stat: "4", label: "Key locations" },
                            { stat: "1,000+", label: "Homes assisted" },
                            { stat: "Trusted", label: "By Pampanga families" },
                        ].map((item) => (
                            <Card
                                key={item.label}
                                className="border-border/80 bg-card rounded-xl text-center shadow-sm"
                            >
                                <CardContent className="py-8">
                                    <p className="text-primary text-3xl font-bold tracking-tight md:text-4xl">
                                        {item.stat}
                                    </p>
                                    <p className="text-muted-foreground mt-2 text-sm font-medium">{item.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section className="py-12 md:py-16">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                            Why families trust Fiesta Communities
                        </h2>
                        <p className="text-muted-foreground mt-3 text-sm leading-relaxed md:text-base">
                            We focus on practical housing, helpful guidance, and communities designed for everyday living
                        </p>
                    </div>
                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        <Card className="border-border/80 rounded-xl py-2 shadow-sm">
                            <CardContent className="space-y-3 pt-6">
                                <div className="text-primary">
                                    <MapPinIcon className="size-9" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-semibold">Accessible locations</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Our developments are positioned near major roads, transport access, schools, and
                                    local establishments.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border/80 rounded-xl py-2 shadow-sm">
                            <CardContent className="space-y-3 pt-6">
                                <div className="text-primary">
                                    <FileSignatureIcon className="size-9" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-semibold">Guided home buying</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    From inquiry to reservation, our team and agents help clients understand every
                                    important step.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border/80 rounded-xl py-2 shadow-sm">
                            <CardContent className="space-y-3 pt-6">
                                <div className="text-primary">
                                    <HomeIcon className="size-9" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-semibold">Community first</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    We don&apos;t just sell units — we help create neighborhoods where families can grow
                                    and feel secure.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="bg-primary text-primary-foreground mb-4 rounded-2xl px-6 py-14 text-center md:px-12 md:py-16">
                    <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Start your homeownership journey with us
                    </h2>
                    <p className="text-primary-foreground/85 mx-auto mt-4 max-w-2xl text-sm leading-relaxed md:text-base">
                        Explore available homes and connect with our trusted property specialists today
                    </p>
                    <Button
                        size="lg"
                        variant="secondary"
                        className="mt-8 rounded-lg px-8 font-semibold"
                        asChild
                    >
                        <Link to="/properties">Browse properties</Link>
                    </Button>
                </section>
            </div>
        </LandingChrome>
    );
};

export default LandingAbout;
