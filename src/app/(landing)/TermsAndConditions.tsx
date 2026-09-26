import { AuthNav } from "@/components/layout/AuthNav";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { BotIcon, FileCheck2Icon } from "lucide-react";
import type { ReactNode } from "react";

const TermsSection = ({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) => (
    <section className="space-y-3">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">{title}</h2>
        <div className="text-muted-foreground space-y-3 text-sm leading-7 md:text-base">
            {children}
        </div>
    </section>
);

const TermsAndConditions = () => (
    <div className="bg-background flex min-h-screen flex-col">
        <AuthNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-12 md:py-14 lg:px-14">
            <ScreenBackLink to="/auth/register" label="Registration" className="mb-6" />

            <header className="border-border/70 space-y-4 border-b pb-8">
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                    <FileCheck2Icon className="size-6" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                    <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                        AFFORDAHOMES
                    </p>
                    <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                        Terms &amp; Conditions
                    </h1>
                    <p className="text-muted-foreground max-w-3xl leading-relaxed">
                        These terms describe responsible use of the AFFORDAHOMES platform and the
                        service workflows available to registered clients.
                    </p>
                </div>
            </header>

            <Card className="border-border/80 mt-8 shadow-sm">
                <CardContent className="space-y-10 py-8 md:px-10 md:py-10">
                    <TermsSection title="Using AFFORDAHOMES">
                        <p>
                            By creating and using a client account, you agree to use AFFORDAHOMES
                            lawfully and consistently with these terms. The platform supports
                            property browsing and service workflows; it does not replace the need to
                            confirm important transaction details with an authorized agent.
                        </p>
                    </TermsSection>

                    <TermsSection title="Your account">
                        <ul className="list-disc space-y-2 pl-5">
                            <li>Provide information that is accurate and reasonably up to date.</li>
                            <li>
                                Keep your password and other account credentials confidential, and
                                do not allow another person to misuse your account.
                            </li>
                            <li>
                                Notify an authorized AFFORDAHOMES representative if you believe your
                                account is being used without permission.
                            </li>
                        </ul>
                    </TermsSection>

                    <TermsSection title="Properties and availability">
                        <p>
                            Property descriptions, images, prices, availability, and other listing
                            details are provided to assist your search. Important information should
                            be confirmed with an authorized agent before you make a decision or rely
                            on it for a transaction.
                        </p>
                        <p>
                            A property's availability or assigned client may change through
                            legitimate inquiry, reservation, cancellation, reassignment, and sale
                            workflows. Displaying a property does not by itself guarantee that it
                            remains available or that a reservation will be approved or completed.
                        </p>
                    </TermsSection>

                    <TermsSection title="Service requests and approvals">
                        <p>
                            Inquiries, appointments, reservations, property-change requests,
                            agent-reassignment requests, and prequalification submissions are
                            subject to the applicable platform workflow and review by the authorized
                            agent or administrator. Submitting a request does not guarantee approval,
                            scheduling, qualification, or completion of a property transaction.
                        </p>
                        <p>
                            When you submit prequalification information or supporting documents,
                            you are responsible for ensuring that the material is relevant, accurate,
                            and yours to provide.
                        </p>
                    </TermsSection>

                    <TermsSection title="Nexia AI assistance">
                        <div className="bg-muted/40 flex items-start gap-3 rounded-lg border p-4">
                            <BotIcon
                                className="text-primary mt-0.5 size-5 shrink-0"
                                aria-hidden="true"
                            />
                            <p>
                                Nexia provides assistive information and can help route a request for
                                human assistance. AI-generated responses may be incomplete or
                                inaccurate. Confirm property availability, pricing, reservations,
                                requirements, and other important transaction details with an
                                authorized AFFORDAHOMES agent.
                            </p>
                        </div>
                    </TermsSection>

                    <TermsSection title="Prohibited use">
                        <p>You must not use the platform to:</p>
                        <ul className="list-disc space-y-2 pl-5">
                            <li>submit false, fraudulent, harmful, or unlawful information;</li>
                            <li>impersonate another person or access an account without permission;</li>
                            <li>
                                interfere with the platform, evade its access controls, introduce
                                malicious code, or attempt to obtain data you are not authorized to
                                access; or
                            </li>
                            <li>
                                harass users, agents, or administrators, or misuse messaging and
                                request workflows.
                            </li>
                        </ul>
                    </TermsSection>

                    <TermsSection title="Service availability and responsibility">
                        <p>
                            AFFORDAHOMES may experience maintenance, connectivity problems, delayed
                            updates, or other interruptions. Reasonable efforts should be made to keep
                            the platform useful and secure, but continuous availability or error-free
                            operation cannot be guaranteed.
                        </p>
                        <p>
                            To the extent permitted by applicable requirements, responsibility for a
                            platform issue should be assessed according to the actual circumstances.
                            These terms do not remove rights or remedies that cannot lawfully be
                            excluded.
                        </p>
                    </TermsSection>

                    <TermsSection title="Privacy">
                        <p>
                            Personal information is handled as described in the AFFORDAHOMES{" "}
                            <Link
                                to="/privacy-notice"
                                className="text-primary font-medium underline underline-offset-4"
                            >
                                Privacy Notice
                            </Link>
                            . Review that notice before registering or submitting information.
                        </p>
                    </TermsSection>

                    <TermsSection title="Changes to these terms">
                        <p>
                            These terms may be updated as the platform and its workflows change.
                            Appropriate notice of material changes should be provided where required.
                            Continued use after an update may be subject to the revised terms and any
                            applicable consent requirements.
                        </p>
                    </TermsSection>
                </CardContent>
            </Card>

            <div className="bg-muted/40 mt-8 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Ready to continue? Return to registration to complete your account details.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild>
                        <Link to="/">Home</Link>
                    </Button>
                    <Button asChild>
                        <Link to="/auth/register">Return to registration</Link>
                    </Button>
                </div>
            </div>
        </main>
        <footer className="border-border bg-card border-t">
            <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between md:px-12 lg:px-14">
                <p className="text-foreground font-semibold tracking-wide">AFFORDAHOMES</p>
                <nav
                    aria-label="Legal and site links"
                    className="text-muted-foreground flex flex-wrap items-center gap-2"
                >
                    <Link to="/privacy-notice" className="hover:text-foreground transition-colors">
                        Privacy Notice
                    </Link>
                    <span aria-hidden="true">|</span>
                    <Link
                        to="/terms-and-conditions"
                        className="hover:text-foreground transition-colors"
                    >
                        Terms &amp; Conditions
                    </Link>
                    <span aria-hidden="true">|</span>
                    <Link to="/" className="hover:text-foreground transition-colors">
                        Home
                    </Link>
                </nav>
            </div>
        </footer>
    </div>
);

export default TermsAndConditions;
