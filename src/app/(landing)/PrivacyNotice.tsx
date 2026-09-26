import { AuthNav } from "@/components/layout/AuthNav";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { LockKeyholeIcon, ShieldCheckIcon } from "lucide-react";
import type { ReactNode } from "react";

const PrivacySection = ({
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

const PrivacyNotice = () => (
    <div className="bg-background flex min-h-screen flex-col">
        <AuthNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-12 md:py-14 lg:px-14">
            <ScreenBackLink to="/auth/register" label="Registration" className="mb-6" />

            <header className="border-border/70 space-y-4 border-b pb-8">
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                    <ShieldCheckIcon className="size-6" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                    <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                        AFFORDAHOMES
                    </p>
                    <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                        Privacy Notice
                    </h1>
                    <p className="text-muted-foreground max-w-3xl leading-relaxed">
                        This notice explains, in general terms, what personal information the
                        AFFORDAHOMES platform may handle and how that information supports its
                        property and client-service workflows.
                    </p>
                </div>
            </header>

            <Card className="border-border/80 mt-8 shadow-sm">
                <CardContent className="space-y-10 py-8 md:px-10 md:py-10">
                    <PrivacySection title="Information the platform may collect">
                        <p>Depending on how you use AFFORDAHOMES, the platform may handle:</p>
                        <ul className="list-disc space-y-2 pl-5">
                            <li>
                                account and contact information, such as your name, email address,
                                phone number, and sign-in credentials;
                            </li>
                            <li>
                                property activity, including inquiries, reservations, requested
                                changes, appointments, and conversations with authorized agents;
                            </li>
                            <li>
                                prequalification information and documents you choose to submit,
                                including relevant employment, income, and supporting details;
                            </li>
                            <li>
                                messages sent through chat or Nexia, including requests that you ask
                                to be forwarded for human assistance; and
                            </li>
                            <li>
                                basic technical, session, and security information needed to operate
                                and protect the platform.
                            </li>
                        </ul>
                    </PrivacySection>

                    <PrivacySection title="Why information is used">
                        <p>
                            Information is used to create and secure accounts, display relevant
                            properties, respond to inquiries, coordinate appointments, manage
                            reservations and change requests, support prequalification reviews, and
                            connect clients with authorized agents or administrators when needed.
                        </p>
                        <p>
                            It may also be used to maintain service records, troubleshoot the
                            platform, prevent misuse, and support legitimate operational or legal
                            requirements applicable to a transaction or service request.
                        </p>
                    </PrivacySection>

                    <PrivacySection title="Who may access information">
                        <p>
                            Access should be limited to authenticated clients and authorized agents
                            or administrators when the information is needed for their assigned
                            system responsibilities. For example, an assigned agent may need client
                            details to respond to an inquiry, appointment, or reservation workflow.
                        </p>
                        <p>
                            AFFORDAHOMES should not disclose personal information beyond what is
                            reasonably necessary for these workflows, platform operation, security,
                            or an applicable legal requirement.
                        </p>
                    </PrivacySection>

                    <PrivacySection title="Security and your responsibilities">
                        <p>
                            Reasonable administrative and technical measures should be used to help
                            protect information. No online service can guarantee absolute security,
                            so you should also use a strong password, keep your credentials private,
                            sign out of shared devices, and report suspicious account activity.
                        </p>
                    </PrivacySection>

                    <PrivacySection title="Retention">
                        <p>
                            Information may be retained for as long as reasonably needed to provide
                            the requested services, maintain transaction and security records,
                            resolve disputes, and meet applicable operational or legal obligations.
                            Different records may require different retention periods; this notice
                            does not set a single fixed period for every category.
                        </p>
                    </PrivacySection>

                    <PrivacySection title="Your privacy rights">
                        <p>
                            Subject to identity verification and applicable requirements, you may
                            ask about personal information relating to you, request access or
                            correction, object to or withdraw consent from certain processing where
                            applicable, and request deletion or blocking when appropriate. You may
                            also raise a concern about how your information is handled.
                        </p>
                        <p>
                            Privacy questions or requests can be raised through the authorized agent
                            or administrator assisting you, or through the communication options
                            available in the AFFORDAHOMES platform. Additional verification may be
                            required before acting on a request to protect your account and data.
                        </p>
                    </PrivacySection>

                    <PrivacySection title="Updates to this notice">
                        <p>
                            This notice may be updated as platform workflows or privacy practices
                            change. When appropriate or required, users should be informed of a
                            material update through the platform or another available notice method.
                        </p>
                    </PrivacySection>
                </CardContent>
            </Card>

            <div className="bg-muted/40 mt-8 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <LockKeyholeIcon
                        className="text-primary mt-0.5 size-5 shrink-0"
                        aria-hidden="true"
                    />
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Review the related Terms &amp; Conditions before creating an account.
                    </p>
                </div>
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

export default PrivacyNotice;
