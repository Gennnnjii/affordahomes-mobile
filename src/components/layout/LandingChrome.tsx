import { BrandLogo } from "@/components/brand/BrandLogo";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const footerLinkClass =
    "hover:text-primary focus-visible:text-primary focus-visible:ring-primary/40 inline-flex rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none";

export const LandingChrome = ({ children }: { children: ReactNode }) => {
    return (
        <div className="bg-background flex min-h-svh flex-col">
            <PublicHeader sticky />
            <main className="flex-1">{children}</main>

            <footer className="bg-foreground text-background mt-auto">
                <div className="mx-auto grid max-w-7xl gap-8 px-3 py-10 sm:gap-10 sm:px-4 sm:py-12 md:grid-cols-3 md:px-12 lg:px-14">
                    <div>
                        <BrandLogo variant="footer" className="mt-0.5" />
                        <p className="text-background/75 mt-4 text-sm leading-relaxed">
                            Building dreams, creating communities in Pampanga since 2010.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold tracking-wide uppercase opacity-90">Quick links</h4>
                        <ul className="text-background/75 mt-4 space-y-2 text-sm">
                            <li>
                                <Link to="/properties" className={footerLinkClass}>
                                    Properties
                                </Link>
                            </li>
                            <li>
                                <Link to="/agents" className={footerLinkClass}>
                                    Our agents
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className={footerLinkClass}>
                                    About us
                                </Link>
                            </li>
                            <li>
                                <a href="/#contact" className={footerLinkClass}>
                                    Contact
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div id="contact">
                        <h4 className="text-sm font-semibold tracking-wide uppercase opacity-90">Contact</h4>
                        <ul className="text-background/75 mt-4 space-y-2 text-sm">
                            <li>
                                <a
                                    href="mailto:nexus.prodcustomerservice@gmail.com"
                                    className={footerLinkClass}
                                >
                                    nexus.prodcustomerservice@gmail.com
                                </a>
                            </li>
                            <li>Pampanga, Philippines</li>
                        </ul>
                    </div>
                </div>
                <p className="text-background/50 border-t border-white/10 py-6 text-center text-xs">
                    © {new Date().getFullYear()} Affordahomes. All rights reserved.
                </p>
            </footer>
        </div>
    );
};
